import type { Kind, Level } from "./types";

/**
 * Parses one chunk file written to the CONCEPT / SCENARIO templates in A1/AGENT_BRIEF.md
 * into structured Markdown fields. Rendering to HTML happens later (render.ts).
 */

export interface ParsedSection {
  key: string;
  label: string;
  md: string;
}

export interface ParsedQuestion {
  id: string;
  kind: Kind;
  level: Level;
  subtopic: string;
  scenarioType?: string;
  context?: string;
  prompt: string;
  /** Slug of the master-notes section this question is explained by. */
  notes?: string;
  sections: ParsedSection[];
}

export interface ParsedChunk {
  title?: string;
  scope: string;
  questions: ParsedQuestion[];
}

const HEADING =
  /^### ([A-Z]\d+-Q\d+)\s+\[(CONCEPT|SCENARIO)\]\s+\[L([1-3])\]\s+Subtopic:\s*(.*?)(?:\s*\|\s*Type:\s*(.+?))?\s*$/;

/** A bold label at the start of a line, with the colon inside or right after the bold. */
const LABEL = /^\*\*([^*]+?)(:)?\*\*(:)?\s*(.*)$/;

interface SectionDef {
  match: RegExp;
  key: string;
  label: string;
}

const SECTION_DEFS: SectionDef[] = [
  { match: /^Notes$/i, key: "notes", label: "Notes" },
  { match: /^Q$/i, key: "prompt", label: "Question" },
  { match: /^Scenario$/i, key: "context", label: "Scenario" },
  { match: /^Question$/i, key: "prompt", label: "Question" },
  { match: /^Why interviewers ask this/i, key: "why", label: "Why interviewers ask this" },
  { match: /^30-second answer/i, key: "short", label: "30-second answer" },
  { match: /^Deep explanation/i, key: "deep", label: "Deep explanation" },
  { match: /^Code$/i, key: "code", label: "Code" },
  { match: /^Common mistakes/i, key: "mistakes", label: "Common mistakes & traps" },
  { match: /^Follow-ups/i, key: "followups", label: "Follow-ups" },
  { match: /^3-YOE vs Senior/i, key: "levels", label: "3-YOE vs senior answer" },
  { match: /^Production connection/i, key: "production", label: "Production connection" },
  { match: /^What a weak answer looks like/i, key: "weak", label: "What a weak answer looks like" },
  { match: /^Strong answer/i, key: "strong", label: "Strong answer" },
  { match: /^Curveball follow-ups/i, key: "curveballs", label: "Curveball follow-ups" },
  { match: /^Senior war story/i, key: "war", label: "Senior war story" },
  { match: /^Scoring rubric/i, key: "rubric", label: "Scoring rubric" },
];

function findDef(rawLabel: string): SectionDef | undefined {
  const label = rawLabel.replace(/:\s*$/, "").trim();
  return SECTION_DEFS.find((d) => d.match.test(label));
}

const isFence = (line: string) => /^\s*(```|~~~)/.test(line);

/** Splits one question body (lines after its heading) into sections. */
function parseBody(lines: string[], id: string): { sections: ParsedSection[] } {
  const sections: ParsedSection[] = [];
  let current: { def: SectionDef; lines: string[] } | null = null;
  let inFence = false;

  const flush = () => {
    if (current) {
      sections.push({
        key: current.def.key,
        label: current.def.label,
        md: current.lines.join("\n").trim(),
      });
    }
  };

  for (const line of lines) {
    if (!inFence) {
      const m = LABEL.exec(line);
      if (m && (m[2] || m[3])) {
        const def = findDef(m[1]);
        if (def) {
          flush();
          current = { def, lines: m[4] ? [m[4]] : [] };
          continue;
        }
      }
    }
    if (isFence(line)) inFence = !inFence;
    if (current) current.lines.push(line);
    else if (line.trim()) {
      throw new Error(`${id}: text before the first labelled section: "${line.slice(0, 60)}"`);
    }
  }
  flush();
  return { sections };
}

export function parseChunk(text: string): ParsedChunk {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const questions: ParsedQuestion[] = [];
  let title: string | undefined;
  const scope: string[] = [];

  let inFence = false;
  let head: RegExpExecArray | null = null;
  let body: string[] = [];

  const finish = () => {
    if (!head) return;
    const [, id, kindRaw, levelRaw, subtopic, scenarioType] = head;
    const { sections } = parseBody(body, id);
    const take = (key: string) => {
      const i = sections.findIndex((s) => s.key === key);
      return i === -1 ? undefined : sections.splice(i, 1)[0].md;
    };
    const prompt = take("prompt");
    if (!prompt) throw new Error(`${id}: missing question text`);
    questions.push({
      id,
      kind: kindRaw === "CONCEPT" ? "concept" : "scenario",
      level: Number(levelRaw) as Level,
      subtopic: subtopic.trim(),
      scenarioType: scenarioType?.trim(),
      context: take("context"),
      prompt,
      notes: take("notes")?.trim() || undefined,
      sections,
    });
  };

  for (const line of lines) {
    if (!inFence) {
      const h = HEADING.exec(line);
      if (h) {
        finish();
        head = h;
        body = [];
        continue;
      }
      if (/^### /.test(line)) {
        throw new Error(`Unrecognised question heading: "${line.slice(0, 80)}"`);
      }
      if (!head && /^## /.test(line)) {
        title ??= line.replace(/^##\s+/, "").trim();
        continue;
      }
    }
    if (isFence(line)) inFence = !inFence;
    if (head) body.push(line);
    else scope.push(line);
  }
  finish();

  return { title, scope: scope.join("\n").trim(), questions };
}

/** "K2a: Data classes" and "05 K3a: Function types" → "Data classes", "Function types". */
export function cleanTitle(title: string): string {
  return title.replace(/^(?:\d+\s+)?[A-Z]\d+[a-z]?:\s*/, "").trim();
}
