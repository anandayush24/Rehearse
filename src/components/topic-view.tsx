"use client";

import { BookOpen, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { QuestionCard } from "@/components/question-card";
import { LEVEL_INFO, PageHeader, ProgressBar, btn, cn } from "@/components/ui";
import type { Kind, Level, Question, TopicData } from "@/content/types";
import { isDue } from "@/lib/srs";
import { useHydrated, useStore } from "@/lib/store";
import { useNow } from "@/lib/use-now";

type StatusFilter = "all" | "todo" | "done" | "due" | "saved";

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "All",
  todo: "To do",
  done: "Done",
  due: "Due",
  saved: "Saved",
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-accent bg-accent-soft text-accent-ink"
          : "border-line text-muted hover:border-accent hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

export function TopicView({ topic, section }: { topic: TopicData; section: string }) {
  const progress = useStore((s) => s.questions);
  const hydrated = useHydrated();
  const visit = useStore((s) => s.visit);
  const now = useNow();

  const [levels, setLevels] = useState<Set<Level>>(new Set());
  const [kind, setKind] = useState<Kind | "all">("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [open, setOpen] = useState<Set<string>>(new Set());

  useEffect(() => visit(topic.id), [visit, topic.id]);

  // Deep links (/topics/x/#A1-Q036) open and scroll to their question.
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!topic.questions.some((q) => q.id === id)) return;
    // Open first, scroll once the card has rendered.
    const open = requestAnimationFrame(() => {
      setOpen(new Set([id]));
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
    });
    return () => cancelAnimationFrame(open);
  }, [topic]);

  const matches = (q: Question) => {
    if (levels.size && !levels.has(q.level)) return false;
    if (kind !== "all" && q.kind !== kind) return false;
    const s = progress[q.id];
    switch (status) {
      case "todo":
        return !s?.done;
      case "done":
        return !!s?.done;
      case "due":
        return isDue(s?.srs, now);
      case "saved":
        return !!s?.saved;
      default:
        return true;
    }
  };
  const visible = useMemo(
    () => topic.questions.filter(matches),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [topic.questions, levels, kind, status, progress],
  );

  const done = hydrated ? topic.questions.filter((q) => progress[q.id]?.done).length : 0;
  const due = hydrated ? topic.questions.filter((q) => isDue(progress[q.id]?.srs, now)).length : 0;
  const toggleLevel = (l: Level) =>
    setLevels((prev) => {
      const next = new Set(prev);
      if (!next.delete(l)) next.add(l);
      return next;
    });
  const toggleOpen = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const allOpen = visible.length > 0 && visible.every((q) => open.has(q.id));

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted">
        <Link href="/" className="hover:text-ink">
          Topics
        </Link>{" "}
        / {section}
      </p>
      <PageHeader title={topic.title}>
        <Link href={`/practice/?topic=${topic.id}`} className={btn}>
          <GraduationCap className="size-4" aria-hidden /> Practice this topic
        </Link>
      </PageHeader>

      {topic.notes && (
        <Link
          href={`/notes/${topic.id}/`}
          className="mb-5 flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent-soft p-4 text-sm font-medium text-accent-ink"
        >
          <BookOpen className="size-5 shrink-0" aria-hidden />
          <span>Read the master notes first, then grind the questions. Each question's Source button jumps back to its part.</span>
        </Link>
      )}

      <div className="mb-5 rounded-2xl border border-line bg-surface p-4 shadow-card">
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span className="font-semibold tabular-nums">
            {done} <span className="font-normal text-muted">of {topic.questions.length} done</span>
          </span>
          {due > 0 && <span className="font-medium text-warn">{due} due for review</span>}
        </div>
        <ProgressBar value={done} max={topic.questions.length} />
        {topic.scopeHtml && (
          <details className="mt-3 text-sm text-muted">
            <summary className="cursor-pointer font-medium text-ink">About this topic</summary>
            <div className="prose-notes mt-2" dangerouslySetInnerHTML={{ __html: topic.scopeHtml }} />
          </details>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-3" role="group" aria-label="Filters">
        <div className="flex flex-wrap items-center gap-1.5">
          {([1, 2, 3] as Level[]).map((l) => (
            <Chip key={l} active={levels.has(l)} onClick={() => toggleLevel(l)}>
              {LEVEL_INFO[l].short} · {LEVEL_INFO[l].name}
            </Chip>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {(["all", "concept", "scenario"] as const).map((k) => (
            <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
              {k === "all" ? "All types" : k === "concept" ? "Concept" : "Scenario"}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((s) => (
            <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
              {STATUS_LABELS[s]}
            </Chip>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOpen(allOpen ? new Set() : new Set(visible.map((q) => q.id)))}
          className="ml-auto text-xs font-medium text-accent-ink hover:underline"
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <p className="mb-3 text-xs text-muted" aria-live="polite">
        Showing {visible.length} of {topic.questions.length} questions
      </p>

      <div className="space-y-3">
        {visible.map((q) => (
          <QuestionCard key={q.id} question={q} open={open.has(q.id)} onToggle={() => toggleOpen(q.id)} />
        ))}
        {visible.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">
            No questions match these filters.
          </p>
        )}
      </div>
    </div>
  );
}
