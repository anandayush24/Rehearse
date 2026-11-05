"use client";

import { ArrowRight, Bookmark, Clock, Flame, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { useNav } from "@/components/nav-provider";
import { categoryById } from "@/content/categories";
import { ProgressRing, btn, btnPrimary, cn } from "@/components/ui";
import { currentStreak } from "@/lib/progress";
import { isDue } from "@/lib/srs";
import { useHydrated, useStore } from "@/lib/store";
import { useNow } from "@/lib/use-now";

function Tile({
  label,
  value,
  children,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  children?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className={cn("mt-1 text-2xl font-semibold tabular-nums", accent)}>{value}</p>
      </div>
      {children}
    </div>
  );
}

export function Dashboard({ category }: { category?: string }) {
  const { nav: fullNav, topics: allTopics, topicById, topicOfQuestion } = useNav();
  const cat = category ? categoryById(category) : undefined;
  const nav = useMemo(
    () => (cat ? { ...fullNav, tracks: fullNav.tracks.filter((t) => cat.tracks.includes(t.id)) } : fullNav),
    [fullNav, cat],
  );
  const topics = useMemo(
    () => (cat ? nav.tracks.flatMap((t) => t.sections.flatMap((s) => s.topics)) : allTopics),
    [cat, nav, allTopics],
  );
  const questions = useStore((s) => s.questions);
  const reviews = useStore((s) => s.reviews);
  const lastTopic = useStore((s) => s.lastTopic);
  const lastQuestion = useStore((s) => s.lastQuestion);
  const hydrated = useHydrated();
  const now = useNow();

  const totals = useMemo(() => {
    let total = 0;
    let done = 0;
    let due = 0;
    let saved = 0;
    for (const t of topics) {
      for (const q of t.qids) {
        total++;
        const s = questions[q];
        if (s?.done) done++;
        if (s?.saved) saved++;
        if (isDue(s?.srs, now)) due++;
      }
    }
    return { total, done, due, saved, streak: currentStreak(reviews, now) };
  }, [topics, questions, reviews, now]);

  const show = (n: number) => (hydrated ? n : "–");
  const resume = lastQuestion ? topicOfQuestion.get(lastQuestion) : lastTopic;
  const resumeTopic = resume ? topicById.get(resume) : undefined;

  if (cat && !topics.length) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{cat.label}</h1>
        <p className="mt-6 rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">
          {cat.label} questions are coming soon.
        </p>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {cat ? cat.label : "Senior interview prep"}
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {totals.total} questions across {topics.length} topics. Read the model answers, then practice them
          until they stick.
        </p>
      </header>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Done" value={hydrated ? `${totals.done}/${totals.total}` : "–"}>
          <ProgressRing value={hydrated ? totals.done : 0} max={totals.total} size={44} />
        </Tile>
        <Tile
          label="Due for review"
          value={show(totals.due)}
          accent={hydrated && totals.due > 0 ? "text-warn" : undefined}
        >
          <Clock className="size-5 text-muted" aria-hidden />
        </Tile>
        <Tile label="Day streak" value={show(totals.streak)}>
          <Flame
            className={cn("size-5", hydrated && totals.streak > 0 ? "text-warn" : "text-muted")}
            aria-hidden
          />
        </Tile>
        <Tile label="Saved" value={show(totals.saved)}>
          <Bookmark className="size-5 text-muted" aria-hidden />
        </Tile>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <Link href={hydrated && totals.due > 0 ? "/practice/?mode=due" : "/practice/"} className={btnPrimary}>
          <GraduationCap className="size-4" aria-hidden />
          {hydrated && totals.due > 0 ? `Review ${totals.due} due` : "Start practice"}
        </Link>
        {hydrated && resumeTopic && (
          <Link href={lastQuestion ? `/q/${lastQuestion}/` : `/topics/${resumeTopic.id}/`} className={btn}>
            Continue: {resumeTopic.title} <ArrowRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>

      {nav.tracks.map((track) => (
        <section key={track.id} className="mb-10">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">
            <span className="mr-2 font-mono text-sm text-muted">{track.id}</span>
            {track.title}
          </h2>
          {track.sections.map((section) => (
            <div key={section.name} className="mb-6">
              <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-accent-ink">
                {section.name}
              </h3>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-3">
                {section.topics.map((t) => {
                  const done = hydrated ? t.qids.filter((q) => questions[q]?.done).length : 0;
                  const due = hydrated ? t.qids.filter((q) => isDue(questions[q]?.srs, now)).length : 0;
                  return (
                    <Link
                      key={t.id}
                      href={`/topics/${t.id}/`}
                      className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card transition-colors hover:border-accent"
                    >
                      <ProgressRing value={done} max={t.qids.length} />
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[11px] text-muted">
                          {t.num} {t.code}
                        </p>
                        <p className="truncate text-sm font-semibold group-hover:text-accent-ink">
                          {t.title}
                        </p>
                        <p className="text-xs text-muted">
                          {done}/{t.qids.length} done
                          {due > 0 && <span className="ml-2 font-medium text-warn">{due} due</span>}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
