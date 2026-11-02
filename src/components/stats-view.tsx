"use client";

import { useMemo } from "react";

import { useNav } from "@/components/nav-provider";
import { LEVEL_INFO, PageHeader, ProgressBar, Skeleton, cn } from "@/components/ui";
import type { Level } from "@/content/types";
import { useManifest } from "@/lib/client-data";
import { dayKey, reviewsByDay } from "@/lib/progress";
import { DAY, isDue } from "@/lib/srs";
import { useHydrated, useStore } from "@/lib/store";
import { useNow } from "@/lib/use-now";

const WEEKS = 16;

function Heatmap({ counts }: { counts: Map<string, number> }) {
  const cells = useMemo(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const start = new Date(today.getTime() - (WEEKS * 7 - 1) * DAY);
    start.setDate(start.getDate() - start.getDay()); // align columns to Sunday
    const out: { key: string; count: number; future: boolean }[] = [];
    for (let d = new Date(start); d <= today || out.length % 7 !== 0; d = new Date(d.getTime() + DAY)) {
      const key = dayKey(d.getTime());
      out.push({ key, count: counts.get(key) ?? 0, future: d > today });
    }
    return out;
  }, [counts]);

  const shade = (n: number) =>
    n === 0 ? "bg-raised" : n < 3 ? "bg-accent/30" : n < 8 ? "bg-accent/60" : "bg-accent";

  return (
    <div className="overflow-x-auto pb-1">
      <div
        className="grid grid-flow-col grid-rows-7 gap-1"
        role="img"
        aria-label="Reviews per day over the last sixteen weeks"
      >
        {cells.map((c) => (
          <div
            key={c.key}
            title={`${c.key}: ${c.count} review${c.count === 1 ? "" : "s"}`}
            className={cn("size-3.5 rounded-[3px]", c.future ? "opacity-0" : shade(c.count))}
          />
        ))}
      </div>
    </div>
  );
}

export function StatsView() {
  const { topics } = useNav();
  const { data: manifest } = useManifest();
  const questions = useStore((s) => s.questions);
  const reviews = useStore((s) => s.reviews);
  const hydrated = useHydrated();
  const now = useNow();

  const counts = useMemo(() => reviewsByDay(reviews), [reviews]);

  const byLevel = useMemo(() => {
    const out: Record<Level, { done: number; total: number }> = {
      1: { done: 0, total: 0 },
      2: { done: 0, total: 0 },
      3: { done: 0, total: 0 },
    };
    if (!manifest) return out;
    for (const t of manifest.topics) {
      for (const q of t.questions) {
        out[q.level].total++;
        if (questions[q.id]?.done) out[q.level].done++;
      }
    }
    return out;
  }, [manifest, questions]);

  if (!hydrated) return <Skeleton className="h-96" />;

  const month = reviews.filter((r) => r.at > now - 30 * DAY);
  const recalled = month.filter((r) => r.grade >= 2).length;
  const retention = month.length ? Math.round((recalled / month.length) * 100) : null;

  return (
    <div>
      <PageHeader
        title="Stats"
        subtitle="Your activity and where the gaps are. Stored only in this browser."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <p className="text-xs font-medium text-muted">Reviews, last 30 days</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{month.length}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <p className="text-xs font-medium text-muted">Recalled well (Good or Easy)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {retention === null ? "–" : `${retention}%`}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <p className="text-xs font-medium text-muted">All-time reviews</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{reviews.length}</p>
        </div>
      </div>

      <section className="mb-6 rounded-2xl border border-line bg-surface p-5 shadow-card">
        <h2 className="mb-3 text-sm font-semibold">Activity</h2>
        <Heatmap counts={counts} />
      </section>

      <section className="mb-6 rounded-2xl border border-line bg-surface p-5 shadow-card">
        <h2 className="mb-4 text-sm font-semibold">By level</h2>
        <div className="space-y-3">
          {([1, 2, 3] as Level[]).map((l) => (
            <div key={l}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium">
                  {LEVEL_INFO[l].short} · {LEVEL_INFO[l].name}
                </span>
                <span className="tabular-nums text-muted">
                  {manifest ? `${byLevel[l].done}/${byLevel[l].total}` : "…"}
                </span>
              </div>
              <ProgressBar value={byLevel[l].done} max={byLevel[l].total} />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <h2 className="mb-4 text-sm font-semibold">By topic</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="pb-2 font-medium">Topic</th>
                <th className="pb-2 font-medium">Progress</th>
                <th className="pb-2 text-right font-medium">Done</th>
                <th className="pb-2 text-right font-medium">Due</th>
                <th className="pb-2 text-right font-medium">Lapses</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((t) => {
                const done = t.qids.filter((q) => questions[q]?.done).length;
                const due = t.qids.filter((q) => isDue(questions[q]?.srs, now)).length;
                const lapses = t.qids.reduce((n, q) => n + (questions[q]?.srs?.lapses ?? 0), 0);
                return (
                  <tr key={t.id} className="border-t border-line">
                    <td className="py-2 pr-3">{t.title}</td>
                    <td className="w-32 py-2 pr-3">
                      <ProgressBar value={done} max={t.qids.length} />
                    </td>
                    <td className="py-2 text-right tabular-nums text-muted">
                      {done}/{t.qids.length}
                    </td>
                    <td
                      className={cn(
                        "py-2 text-right tabular-nums",
                        due ? "font-semibold text-warn" : "text-muted",
                      )}
                    >
                      {due}
                    </td>
                    <td className="py-2 text-right tabular-nums text-muted">{lapses}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
