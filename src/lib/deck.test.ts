import { describe, expect, it } from "vitest";

import type { TopicMeta } from "@/content/types";

import { DEFAULT_DECK, buildDeck } from "./deck";
import { DAY, schedule } from "./srs";
import { emptyProgress } from "./state";

const NOW = 1_700_000_000_000;
const q = (n: number, level: 1 | 2 | 3 = 2, kind: "concept" | "scenario" = "concept") => ({
  id: `A1-Q${String(n).padStart(3, "0")}`,
  level,
  kind,
  subtopic: `s${n}`,
});
const topics: TopicMeta[] = [
  {
    id: "t1",
    track: "A1",
    num: "01",
    code: "K1",
    title: "T1",
    section: "Kotlin",
    questions: [q(1, 1), q(2, 2), q(3, 3, "scenario")],
  },
  { id: "t2", track: "A1", num: "02", code: "K2", title: "T2", section: "Kotlin", questions: [q(4), q(5)] },
];
const noShuffle = () => 0.999999; // Fisher–Yates with this leaves the order unchanged

describe("buildDeck", () => {
  it("smart: due first (most overdue first), then unseen", () => {
    const p = emptyProgress();
    p.questions["A1-Q005"] = { srs: schedule(undefined, 2, NOW - 3 * DAY) }; // due 2 days ago
    p.questions["A1-Q004"] = { srs: schedule(undefined, 2, NOW - 2 * DAY) }; // due 1 day ago
    p.questions["A1-Q001"] = { srs: schedule(undefined, 2, NOW) }; // not due yet
    const deck = buildDeck(topics, p, { ...DEFAULT_DECK, size: 10 }, NOW, noShuffle);
    expect(deck.slice(0, 2)).toEqual(["A1-Q005", "A1-Q004"]);
    expect(deck.slice(2, 4).sort()).toEqual(["A1-Q002", "A1-Q003"]);
    expect(deck[4]).toBe("A1-Q001");
  });

  it("filters by scope, level and kind", () => {
    const p = emptyProgress();
    expect(buildDeck(topics, p, { ...DEFAULT_DECK, scope: "t2" }, NOW, noShuffle)).toEqual([
      "A1-Q004",
      "A1-Q005",
    ]);
    expect(buildDeck(topics, p, { ...DEFAULT_DECK, levels: [3] }, NOW, noShuffle)).toEqual(["A1-Q003"]);
    expect(buildDeck(topics, p, { ...DEFAULT_DECK, kind: "scenario" }, NOW, noShuffle)).toEqual(["A1-Q003"]);
  });

  it("respects size", () => {
    expect(buildDeck(topics, emptyProgress(), { ...DEFAULT_DECK, size: 2 }, NOW)).toHaveLength(2);
  });

  it("due / new / saved / weak sources", () => {
    const p = emptyProgress();
    p.questions["A1-Q001"] = { srs: schedule(undefined, 2, NOW - 2 * DAY) }; // due
    p.questions["A1-Q002"] = { saved: true };
    let hard = schedule(undefined, 0, NOW - DAY); // a lapse
    hard = { ...hard, due: NOW + DAY };
    p.questions["A1-Q003"] = { srs: hard };

    expect(buildDeck(topics, p, { ...DEFAULT_DECK, source: "due" }, NOW)).toEqual(["A1-Q001"]);
    expect(buildDeck(topics, p, { ...DEFAULT_DECK, source: "new" }, NOW).sort()).toEqual([
      "A1-Q002",
      "A1-Q004",
      "A1-Q005",
    ]);
    expect(buildDeck(topics, p, { ...DEFAULT_DECK, source: "saved" }, NOW)).toEqual(["A1-Q002"]);
    expect(buildDeck(topics, p, { ...DEFAULT_DECK, source: "weak" }, NOW)).toEqual(["A1-Q003"]);
  });
});
