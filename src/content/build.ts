import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { trackConfig } from "./config";
import { cleanTitle, parseChunk, type ParsedQuestion } from "./parse";
import { plainText, renderMarkdown } from "./render";
import {
  ManifestSchema,
  QuestionSchema,
  SearchDocSchema,
  TopicDataSchema,
  type Manifest,
  type Question,
  type SearchDoc,
  type TopicData,
  type TopicMeta,
} from "./types";

/** `01_K1a_p2.md` → group "01_K1a". */
const PART = /^(\d+)_([A-Z]\w*?)_p\d+\.md$/;

export interface BuildResult {
  manifest: Manifest;
  topics: TopicData[];
  search: SearchDoc[];
}

/** What each question kind must contain; a missing section fails the build. */
const REQUIRED: Record<"concept" | "scenario", string[]> = {
  concept: ["short", "deep"],
  scenario: ["context", "strong"],
};

function validateParsed(q: ParsedQuestion): void {
  const have = new Set(q.sections.map((s) => s.key));
  if (q.context) have.add("context");
  const missing = REQUIRED[q.kind].filter((k) => !have.has(k));
  if (missing.length) throw new Error(`${q.id}: missing section(s): ${missing.join(", ")}`);
}

async function listTracks(contentRoot: string): Promise<string[]> {
  const entries = await readdir(contentRoot, { withFileTypes: true });
  const tracks: string[] = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    try {
      await readdir(path.join(contentRoot, e.name, "chunks"));
      tracks.push(e.name);
    } catch {
      /* not a track folder */
    }
  }
  return tracks.sort();
}

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** `<TRACK>/notes/<NN>_<code>.md`, split on `## ` headings (outside code fences). Missing file → no notes. */
async function buildNotes(file: string) {
  let md: string;
  try {
    md = await readFile(file, "utf8");
  } catch {
    return undefined;
  }
  const parts: { title: string; lines: string[] }[] = [];
  let fence = false;
  for (const line of md.replace(/\r\n/g, "\n").split("\n")) {
    if (/^\s*```/.test(line)) fence = !fence;
    const h = !fence && /^## (.+)/.exec(line);
    if (h) parts.push({ title: h[1].trim(), lines: [] });
    else parts.at(-1)?.lines.push(line);
  }
  return Promise.all(
    parts.map(async (p) => ({ id: slug(p.title), title: p.title, html: await renderMarkdown(p.lines.join("\n")) })),
  );
}

async function buildQuestion(topic: string, q: ParsedQuestion): Promise<Question> {
  const sections = await Promise.all(
    q.sections.map(async (s) => ({ key: s.key, label: s.label, html: await renderMarkdown(s.md) })),
  );
  return QuestionSchema.parse({
    id: q.id,
    topic,
    kind: q.kind,
    level: q.level,
    subtopic: q.subtopic,
    scenarioType: q.scenarioType,
    contextHtml: q.context ? await renderMarkdown(q.context) : undefined,
    promptHtml: await renderMarkdown(q.prompt),
    notes: q.notes,
    sections,
  });
}

export async function buildContent(contentRoot: string): Promise<BuildResult> {
  const tracks = await listTracks(contentRoot);
  if (!tracks.length) throw new Error(`No <TRACK>/chunks folders found in ${contentRoot}`);

  const topics: TopicData[] = [];
  const metas: TopicMeta[] = [];
  const search: SearchDoc[] = [];
  const manifestTracks: Manifest["tracks"] = [];
  const seen = new Set<string>();

  for (const track of tracks) {
    const cfg = trackConfig(track);
    const dir = path.join(contentRoot, track, "chunks");
    const files = (await readdir(dir)).filter((f) => PART.test(f)).sort();

    const groups = new Map<string, string[]>();
    for (const f of files) {
      const m = PART.exec(f)!;
      const key = `${m[1]}_${m[2]}`;
      groups.set(key, [...(groups.get(key) ?? []), f]);
    }

    const sections = new Map<string, string[]>();
    for (const [key, parts] of groups) {
      const [num, code] = key.split("_");
      const id = `${track}-${num}-${code}`.toLowerCase();

      const parsed = [];
      for (const f of parts) {
        try {
          parsed.push(parseChunk(await readFile(path.join(dir, f), "utf8")));
        } catch (err) {
          throw new Error(`${track}/chunks/${f}: ${(err as Error).message}`);
        }
      }
      const title = cleanTitle(parsed[0].title ?? key);
      const scope = parsed
        .map((p) => p.scope)
        .filter(Boolean)
        .join("\n\n");
      const rawQuestions = parsed.flatMap((p) => p.questions);
      rawQuestions.forEach(validateParsed);

      const notes = await buildNotes(path.join(contentRoot, track, "notes", `${key}.md`));
      const questions: Question[] = [];
      for (const rq of rawQuestions) {
        if (rq.notes && !notes?.some((n) => n.id === rq.notes))
          throw new Error(`${rq.id}: Notes: "${rq.notes}" is not a section of ${track}/notes/${key}.md`);
        if (seen.has(rq.id)) throw new Error(`Duplicate question id ${rq.id} (in ${key})`);
        seen.add(rq.id);
        questions.push(await buildQuestion(id, rq));
        search.push(
          SearchDocSchema.parse({
            id: rq.id,
            topic: id,
            title: rq.subtopic,
            text: plainText(
              [rq.prompt, rq.context ?? "", rq.sections.find((s) => s.key === "short")?.md ?? ""].join(" "),
            ),
          }),
        );
      }

      const section = cfg.sections[code[0]] ?? "Other";
      sections.set(section, [...(sections.get(section) ?? []), id]);
      topics.push(TopicDataSchema.parse({ id, title, scopeHtml: await renderMarkdown(scope), notes, questions }));
      metas.push({
        id,
        track,
        num,
        code,
        title,
        section,
        hasNotes: !!notes,
        questions: questions.map(({ id: qid, level, kind, subtopic }) => ({
          id: qid,
          level,
          kind,
          subtopic,
        })),
      });
    }

    manifestTracks.push({
      id: track,
      title: cfg.title,
      sections: [...sections].map(([name, ids]) => ({ name, topics: ids })),
    });
  }

  const contentHash = createHash("sha1").update(JSON.stringify(topics)).digest("hex").slice(0, 12);
  const manifest = ManifestSchema.parse({ version: 1, contentHash, tracks: manifestTracks, topics: metas });
  return { manifest, topics, search };
}

/** Writes the build result as static JSON under `outDir` (served from /data). */
export async function writeContent(result: BuildResult, outDir: string): Promise<void> {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(path.join(outDir, "topics"), { recursive: true });
  const write = (file: string, data: unknown) => writeFile(path.join(outDir, file), JSON.stringify(data));
  await write("manifest.json", result.manifest);
  await write("search.json", result.search);
  await Promise.all(result.topics.map((t) => write(`topics/${t.id}.json`, t)));
}
