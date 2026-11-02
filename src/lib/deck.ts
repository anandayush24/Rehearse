import type { Kind, Level, TopicMeta } from "@/content/types";

import { isDue } from "./srs";
import type { Progress } from "./state";

export type DeckSource = "smart" | "due" | "new" | "saved" | "weak";

export interface DeckOptions {
  /** "all" or a topic id. */
  scope: string;
  levels: Level[];
  kind: Kind | "all";
  source: DeckSource;
  size: number;
}

export const DEFAULT_DECK: DeckOptions = { scope: "all", levels: [], kind: "all", source: "smart", size: 20 };

function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Picks question ids for a practice session.
 * "smart": due cards (most overdue first), then unseen (shuffled), then the rest by soonest due.
 */
export function buildDeck(
  topics: TopicMeta[],
  progress: Pick<Progress, "questions">,
  opts: DeckOptions,
  now: number,
  rand: () => number = Math.random,
): string[] {
  const pool = topics
    .filter((t) => opts.scope === "all" || t.id === opts.scope)
    .flatMap((t) => t.questions)
    .filter(
      (q) =>
        (opts.levels.length === 0 || opts.levels.includes(q.level)) &&
        (opts.kind === "all" || q.kind === opts.kind),
    );

  const state = (id: string) => progress.questions[id];
  const due = pool
    .filter((q) => isDue(state(q.id)?.srs, now))
    .sort((a, b) => state(a.id)!.srs!.due - state(b.id)!.srs!.due);
  const unseen = pool.filter((q) => !state(q.id)?.srs);
  const learning = pool
    .filter((q) => state(q.id)?.srs && !isDue(state(q.id)?.srs, now))
    .sort((a, b) => state(a.id)!.srs!.due - state(b.id)!.srs!.due);

  let ids: string[];
  switch (opts.source) {
    case "due":
      ids = due.map((q) => q.id);
      break;
    case "new":
      ids = shuffle(unseen, rand).map((q) => q.id);
      break;
    case "saved":
      ids = shuffle(
        pool.filter((q) => state(q.id)?.saved),
        rand,
      ).map((q) => q.id);
      break;
    case "weak":
      ids = pool
        .filter((q) => {
          const s = state(q.id)?.srs;
          return !!s && (s.lapses > 0 || s.ease < 2.3);
        })
        .sort((a, b) => state(a.id)!.srs!.ease - state(b.id)!.srs!.ease)
        .map((q) => q.id);
      break;
    default:
      ids = [...due, ...shuffle(unseen, rand), ...learning].map((q) => q.id);
  }
  return ids.slice(0, opts.size);
}
