import { isDue } from "./srs";
import type { Progress, Review } from "./state";
import type { QuestionMeta, TopicMeta } from "../content/types";

/** Pure helpers over the manifest and the reader's progress. */

export interface TopicStats {
  total: number;
  done: number;
  due: number;
  saved: number;
}

export function topicStats(topic: TopicMeta, progress: Progress, now: number): TopicStats {
  let done = 0;
  let due = 0;
  let saved = 0;
  for (const q of topic.questions) {
    const s = progress.questions[q.id];
    if (!s) continue;
    if (s.done) done++;
    if (s.saved) saved++;
    if (isDue(s.srs, now)) due++;
  }
  return { total: topic.questions.length, done, due, saved };
}

export function overallStats(topics: TopicMeta[], progress: Progress, now: number): TopicStats {
  return topics.reduce<TopicStats>(
    (acc, t) => {
      const s = topicStats(t, progress, now);
      return {
        total: acc.total + s.total,
        done: acc.done + s.done,
        due: acc.due + s.due,
        saved: acc.saved + s.saved,
      };
    },
    { total: 0, done: 0, due: 0, saved: 0 },
  );
}

export type QuestionStatus = "unseen" | "due" | "learning" | "done";

export function questionStatus(q: QuestionMeta, progress: Progress, now: number): QuestionStatus {
  const s = progress.questions[q.id];
  if (isDue(s?.srs, now)) return "due";
  if (s?.done) return "done";
  if (s?.srs) return "learning";
  return "unseen";
}

/** Local-calendar day key, e.g. "2026-11-02". */
export function dayKey(ts: number): string {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Consecutive days with at least one review, counting back from today (or yesterday). */
export function currentStreak(reviews: Review[], now: number): number {
  const days = new Set(reviews.map((r) => dayKey(r.at)));
  const cursor = new Date(now);
  if (!days.has(dayKey(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor.getTime()))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Review counts per local day for the activity heatmap. */
export function reviewsByDay(reviews: Review[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const r of reviews) out.set(dayKey(r.at), (out.get(dayKey(r.at)) ?? 0) + 1);
  return out;
}
