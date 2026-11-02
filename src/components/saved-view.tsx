"use client";

import { Bookmark } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { useNav } from "@/components/nav-provider";
import { KindBadge, LevelBadge, PageHeader, Skeleton } from "@/components/ui";
import { useManifest } from "@/lib/client-data";
import { useHydrated, useStore } from "@/lib/store";

export function SavedView() {
  const { topics } = useNav();
  const { data: manifest } = useManifest();
  const questions = useStore((s) => s.questions);
  const hydrated = useHydrated();

  const groups = useMemo(() => {
    if (!manifest) return [];
    return manifest.topics
      .map((t) => ({ topic: t, items: t.questions.filter((q) => questions[q.id]?.saved) }))
      .filter((g) => g.items.length > 0);
  }, [manifest, questions]);

  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const notes = topics.reduce((n, t) => n + t.qids.filter((q) => questions[q]?.note).length, 0);

  if (!hydrated || !manifest) return <Skeleton className="h-64" />;

  return (
    <div>
      <PageHeader
        title="Saved"
        subtitle={
          total
            ? `${total} saved question${total === 1 ? "" : "s"}${notes ? ` · ${notes} with notes` : ""}`
            : "Questions you bookmark appear here."
        }
      />
      {total === 0 && (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">
          <Bookmark className="mx-auto mb-3 size-6" aria-hidden />
          Nothing saved yet. Use <span className="font-medium text-ink">Save</span> on any question to collect
          it here.
        </div>
      )}
      <div className="space-y-6">
        {groups.map(({ topic, items }) => (
          <section key={topic.id}>
            <h2 className="mb-2 text-sm font-semibold">
              <Link href={`/topics/${topic.id}/`} className="hover:text-accent-ink">
                {topic.title}
              </Link>
            </h2>
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
              {items.map((q) => (
                <li key={q.id}>
                  <Link
                    href={`/q/${q.id}/`}
                    className="flex flex-wrap items-center gap-2.5 px-4 py-3 hover:bg-raised/50"
                  >
                    <span className="font-mono text-[11px] text-muted">{q.id}</span>
                    <LevelBadge level={q.level} />
                    <KindBadge kind={q.kind} />
                    <span className="min-w-0 flex-1 text-sm font-medium">{q.subtopic}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
