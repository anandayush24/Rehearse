import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { cleanTitle, parseChunk } from "./parse";

const fixture = readFileSync(path.join(__dirname, "../../tests/fixtures/Z1/chunks/01_K1a_p1.md"), "utf8");

describe("parseChunk", () => {
  const chunk = parseChunk(fixture);

  it("reads the title and scope", () => {
    expect(chunk.title).toBe("K1a: Sample topic");
    expect(chunk.scope).toMatch(/^Scope: a tiny fixture/);
  });

  it("parses a concept question", () => {
    const q = chunk.questions[0];
    expect(q).toMatchObject({ id: "Z1-Q001", kind: "concept", level: 2, subtopic: "Cancellation" });
    expect(q.prompt).toContain("List<out E>");
    expect(q.context).toBeUndefined();
    expect(q.sections.map((s) => s.key)).toEqual([
      "why",
      "short",
      "deep",
      "code",
      "mistakes",
      "followups",
      "levels",
      "production",
    ]);
  });

  it("keeps unknown bold labels inside the section they belong to", () => {
    const deep = chunk.questions[0].sections.find((s) => s.key === "deep")!;
    expect(deep.md).toContain("**Resume path:**");
  });

  it("ignores labels and headings inside code fences", () => {
    const code = chunk.questions[0].sections.find((s) => s.key === "code")!;
    expect(code.md).toContain("// **Q:** inside a fence is not a label");
    expect(chunk.questions).toHaveLength(2);
  });

  it("parses a scenario question with its type", () => {
    const q = chunk.questions[1];
    expect(q).toMatchObject({
      id: "Z1-Q002",
      kind: "scenario",
      level: 3,
      scenarioType: "Production incident",
    });
    expect(q.context).toBe("A feed screen drops events under load.");
    expect(q.prompt).toBe("What is the root cause and how do you fix it?");
    expect(q.sections.map((s) => s.key)).toEqual(["weak", "strong", "curveballs", "war", "rubric"]);
  });

  it("rejects a malformed question heading", () => {
    expect(() => parseChunk("### Z1-Q009 [WEIRD] [L9] nope\n**Q:** x")).toThrow(
      /Unrecognised question heading/,
    );
  });

  it("rejects text before the first labelled section", () => {
    expect(() => parseChunk("### Z1-Q009 [CONCEPT] [L1] Subtopic: x\nstray text\n**Q:** x")).toThrow(
      /before the first labelled section/,
    );
  });

  it("requires question text", () => {
    expect(() => parseChunk("### Z1-Q009 [CONCEPT] [L1] Subtopic: x\n**Deep explanation:** y")).toThrow(
      /missing question text/,
    );
  });
});

describe("cleanTitle", () => {
  it.each([
    ["K2a: Data classes", "Data classes"],
    ["05 K3a: Function types", "Function types"],
    ["Platform Cross-Cutting Scenarios", "Platform Cross-Cutting Scenarios"],
  ])("%s", (input, expected) => expect(cleanTitle(input)).toBe(expected));
});
