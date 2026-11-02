import { describe, expect, it } from "vitest";

import { DAY, MINUTE, formatInterval, isDue, schedule, type SrsCard } from "./srs";

const NOW = 1_700_000_000_000;

describe("schedule", () => {
  it("starts a new card at 1 day on Good, then 3, then grows by ease", () => {
    const first = schedule(undefined, 2, NOW);
    expect(first).toMatchObject({ interval: 1, reps: 1, due: NOW + DAY });
    const second = schedule(first, 2, NOW + DAY);
    expect(second.interval).toBe(3);
    const third = schedule(second, 2, NOW + 4 * DAY);
    expect(third.interval).toBe(Math.round(3 * second.ease));
  });

  it("resets on Again, counts a lapse and lowers ease", () => {
    const learned: SrsCard = { ease: 2.5, interval: 10, due: NOW, reps: 4, lapses: 0, last: NOW };
    const again = schedule(learned, 0, NOW);
    expect(again).toMatchObject({ reps: 0, interval: 0, lapses: 1, due: NOW + 10 * MINUTE });
    expect(again.ease).toBeCloseTo(2.3);
  });

  it("Hard grows slowly and Easy grows fastest", () => {
    const card: SrsCard = { ease: 2.5, interval: 10, due: NOW, reps: 3, lapses: 0, last: NOW };
    const hard = schedule(card, 1, NOW);
    const good = schedule(card, 2, NOW);
    const easy = schedule(card, 3, NOW);
    expect(hard.interval).toBeLessThan(good.interval);
    expect(good.interval).toBeLessThan(easy.interval);
    expect(hard.ease).toBeLessThan(card.ease);
    expect(easy.ease).toBeGreaterThan(card.ease);
  });

  it("keeps ease within bounds", () => {
    let card = schedule(undefined, 0, NOW);
    for (let i = 0; i < 20; i++) card = schedule(card, 0, NOW);
    expect(card.ease).toBe(1.3);
    for (let i = 0; i < 40; i++) card = schedule(card, 3, NOW);
    expect(card.ease).toBe(3);
  });

  it("never schedules a graduated card for less than a day", () => {
    const tiny: SrsCard = { ease: 1.3, interval: 0, due: NOW, reps: 5, lapses: 0, last: NOW };
    expect(schedule(tiny, 1, NOW).interval).toBeGreaterThanOrEqual(1);
  });
});

describe("isDue / formatInterval", () => {
  it("reports due cards", () => {
    const card = schedule(undefined, 2, NOW);
    expect(isDue(card, NOW)).toBe(false);
    expect(isDue(card, NOW + DAY)).toBe(true);
    expect(isDue(undefined, NOW)).toBe(false);
  });

  it.each([
    [10 * MINUTE, "10 min"],
    [DAY, "1 day"],
    [3 * DAY, "3 days"],
    [60 * DAY, "2 mo"],
  ])("formats %i ms", (ms, label) => {
    const card: SrsCard = { ease: 2.5, interval: 1, due: NOW + ms, reps: 1, lapses: 0, last: NOW };
    expect(formatInterval(card, NOW)).toBe(label);
  });
});
