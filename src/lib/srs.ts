import { z } from "zod";

/**
 * Spaced repetition, SM-2 style. Pure functions: the store passes `now` in so tests are deterministic.
 * Grades: 0 Again, 1 Hard, 2 Good, 3 Easy.
 */

export const MINUTE = 60_000;
export const DAY = 24 * 60 * MINUTE;

export const GradeSchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);
export type Grade = z.infer<typeof GradeSchema>;

export const SrsCardSchema = z.object({
  ease: z.number().min(1.3).max(3),
  /** Days until the next review at the time it was scheduled. */
  interval: z.number().min(0),
  due: z.number(),
  reps: z.number().int().min(0),
  lapses: z.number().int().min(0),
  last: z.number(),
});
export type SrsCard = z.infer<typeof SrsCardSchema>;

export const GRADE_LABELS: Record<Grade, string> = { 0: "Again", 1: "Hard", 2: "Good", 3: "Easy" };

const clampEase = (e: number) => Math.min(3, Math.max(1.3, e));

export function schedule(card: SrsCard | undefined, grade: Grade, now: number): SrsCard {
  const prev: SrsCard = card ?? { ease: 2.5, interval: 0, due: now, reps: 0, lapses: 0, last: now };

  if (grade === 0) {
    return {
      ease: clampEase(prev.ease - 0.2),
      interval: 0,
      due: now + 10 * MINUTE,
      reps: 0,
      lapses: prev.lapses + 1,
      last: now,
    };
  }

  let interval: number;
  let ease = prev.ease;
  if (grade === 1) {
    interval = Math.max(1, Math.round(prev.interval * 1.2));
    ease -= 0.15;
  } else if (grade === 2) {
    interval = prev.reps === 0 ? 1 : prev.reps === 1 ? 3 : Math.round(prev.interval * prev.ease);
  } else {
    interval = prev.reps === 0 ? 4 : Math.round(prev.interval * prev.ease * 1.3);
    ease += 0.15;
  }
  interval = Math.max(interval, 1);

  return {
    ease: clampEase(ease),
    interval,
    due: now + interval * DAY,
    reps: prev.reps + 1,
    lapses: prev.lapses,
    last: now,
  };
}

export const isDue = (card: SrsCard | undefined, now: number) => !!card && card.due <= now;

/** "10 min", "1 day", "3 days", "2 mo" for the preview under each grade button. */
export function formatInterval(card: SrsCard, now: number): string {
  const ms = Math.max(0, card.due - now);
  if (ms < 60 * MINUTE) return `${Math.max(1, Math.round(ms / MINUTE))} min`;
  const days = Math.round(ms / DAY);
  if (days < 30) return days === 1 ? "1 day" : `${days} days`;
  return `${Math.round(days / 30)} mo`;
}
