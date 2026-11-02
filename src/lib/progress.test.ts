import { describe, expect, it } from "vitest";

import { currentStreak, overallStats, questionStatus, reviewsByDay, topicStats } from "./progress";
import { DAY, schedule } from "./srs";
import { emptyProgress } from "./state";
import type { TopicMeta } from "../content/types";

const NOW = new Date(2026, 10, 2, 12, 0, 0).getTime();

const topic: TopicMeta = {
  id: "a1-01-k1a",
  track: "A1",
  num: "01",
  code: "K1a",
  title: "Sample",
  section: "Kotlin",
  questions: [
    { id: "A1-Q001", level: 1, kind: "concept", subtopic: "a" },
    { id: "A1-Q002", level: 2, kind: "concept", subtopic: "b" },
    { id: "A1-Q003", level: 3, kind: "scenario", subtopic: "c" },
  ],
};

describe("topicStats / questionStatus", () => {
  it("counts done, saved and due questions", () => {
    const p = emptyProgress();
    p.questions["A1-Q001"] = { done: true };
    p.questions["A1-Q002"] = { saved: true, srs: schedule(undefined, 2, NOW - 2 * DAY) };
    expect(topicStats(topic, p, NOW)).toEqual({ total: 3, done: 1, due: 1, saved: 1 });
    expect(overallStats([topic, topic], p, NOW).total).toBe(6);
    expect(questionStatus(topic.questions[0], p, NOW)).toBe("done");
    expect(questionStatus(topic.questions[1], p, NOW)).toBe("due");
    expect(questionStatus(topic.questions[2], p, NOW)).toBe("unseen");
  });
});

describe("currentStreak", () => {
  const at = (daysAgo: number) => ({ id: "A1-Q001", grade: 2 as const, at: NOW - daysAgo * DAY });

  it("counts consecutive days including today", () => {
    expect(currentStreak([at(0), at(1), at(2)], NOW)).toBe(3);
  });

  it("keeps the streak alive until the day is over", () => {
    expect(currentStreak([at(1), at(2)], NOW)).toBe(2);
  });

  it("breaks on a gap and is 0 with no recent reviews", () => {
    expect(currentStreak([at(0), at(2)], NOW)).toBe(1);
    expect(currentStreak([at(3)], NOW)).toBe(0);
    expect(currentStreak([], NOW)).toBe(0);
  });

  it("groups reviews by local day", () => {
    const days = reviewsByDay([at(0), at(0), at(1)]);
    expect([...days.values()].sort()).toEqual([1, 2]);
  });
});
