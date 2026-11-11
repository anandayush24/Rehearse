import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildContent } from "./build";
import { renderMarkdown } from "./render";

describe("renderMarkdown", () => {
  it("keeps angle-bracket generics outside code as visible text", async () => {
    const html = await renderMarkdown("A `List<out E>` and a bare List<out E> here.");
    expect(html).toContain("List&#x3C;out E>");
    expect(html).not.toContain("<out");
  });

  it("highlights fenced code with theme variables", async () => {
    const html = await renderMarkdown("```kotlin\nval x = 1\n```");
    expect(html).toContain("shiki");
    expect(html).toContain("--shiki-light");
  });

  it("falls back to plain text for unknown languages", async () => {
    await expect(renderMarkdown("```nope\nhello\n```")).resolves.toContain("hello");
  });
});

describe("buildContent (fixture)", () => {
  it("builds a manifest, topics and search docs", async () => {
    const result = await buildContent(path.join(__dirname, "../../tests/fixtures"));
    expect(result.manifest.topics).toHaveLength(1);
    expect(result.manifest.topics[0]).toMatchObject({
      id: "z1-01-k1a",
      title: "Sample topic",
      section: "Other",
    });
    expect(result.manifest.topics[0].questions.map((q) => q.id)).toEqual(["Z1-Q001", "Z1-Q002"]);
    expect(result.search).toHaveLength(2);
    expect(result.topics[0].questions[1].contextHtml).toContain("feed screen");
  });
});

// Runs against the real notes when they sit next to the app (skipped in a standalone checkout).
const realRoot = path.join(__dirname, "../../..");
describe.skipIf(!existsSync(path.join(realRoot, "A1", "chunks")))("buildContent (real notes)", () => {
  it("parses every question with unique, ordered ids", async () => {
    const { manifest } = await buildContent(realRoot);
    const ids = manifest.topics.flatMap((t) => t.questions.map((q) => q.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThan(700);
    // Topics may be notes-only stubs (no questions yet), so no per-topic count is asserted.
  }, 300_000); // the full build grows with the notes
});
