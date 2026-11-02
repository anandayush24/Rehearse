"use client";

import { ArrowRight, Eye, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useNav } from "@/components/nav-provider";
import { QuestionBody } from "@/components/question-body";
import {
  KindBadge,
  LEVEL_INFO,
  LevelBadge,
  PageHeader,
  ProgressBar,
  Skeleton,
  btn,
  btnPrimary,
  cn,
} from "@/components/ui";
import type { Kind, Level, Question } from "@/content/types";
import { loadTopic, useManifest } from "@/lib/client-data";
import { DEFAULT_DECK, buildDeck, type DeckOptions, type DeckSource } from "@/lib/deck";
import { GRADE_LABELS, formatInterval, schedule, type Grade } from "@/lib/srs";
import { useHydrated, useStore } from "@/lib/store";
import { useNow } from "@/lib/use-now";

const SOURCES: { id: DeckSource; label: string; hint: string }[] = [
  { id: "smart", label: "Smart mix", hint: "Due reviews first, then new questions" },
  { id: "due", label: "Due reviews", hint: "Only questions scheduled for today" },
  { id: "new", label: "New", hint: "Questions you have not practiced yet" },
  { id: "weak", label: "Weak spots", hint: "Questions you have lapsed on" },
  { id: "saved", label: "Saved", hint: "Your bookmarks" },
];

const GRADE_STYLE: Record<Grade, string> = {
  0: "border-danger/40 text-danger hover:bg-danger-soft",
  1: "border-warn/40 text-warn hover:bg-warn-soft",
  2: "border-success/40 text-success hover:bg-success-soft",
  3: "border-accent/40 text-accent-ink hover:bg-accent-soft",
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
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-accent bg-accent-soft text-accent-ink"
          : "border-line text-muted hover:border-accent hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

type Phase = "setup" | "loading" | "session" | "summary" | "error";

export function PracticeApp() {
  const params = useSearchParams();
  const { nav, topicOfQuestion } = useNav();
  const { data: manifest, error: manifestError } = useManifest();
  const hydrated = useHydrated();
  const questions = useStore((s) => s.questions);
  const review = useStore((s) => s.review);
  const now = useNow();

  const [opts, setOpts] = useState<DeckOptions>(() => ({
    ...DEFAULT_DECK,
    scope: params.get("topic") ?? "all",
    source: params.get("mode") === "due" ? "due" : "smart",
  }));
  const [phase, setPhase] = useState<Phase>("setup");
  const [deck, setDeck] = useState<string[]>([]);
  const [bank, setBank] = useState<Map<string, Question>>(new Map());
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<Grade[]>([]);

  const progress = useMemo(() => ({ questions }), [questions]);
  const available = useMemo(
    () =>
      manifest && hydrated ? buildDeck(manifest.topics, progress, { ...opts, size: 100_000 }, now).length : 0,
    [manifest, hydrated, progress, opts, now],
  );

  const start = () => {
    if (!manifest) return;
    const ids = buildDeck(manifest.topics, progress, opts, Date.now());
    if (!ids.length) return;
    setPhase("loading");
    const topicIds = new Set(ids.map((id) => topicOfQuestion.get(id)!));
    Promise.all([...topicIds].map(loadTopic)).then(
      (topics) => {
        setBank(new Map(topics.flatMap((t) => t.questions.map((q) => [q.id, q] as const))));
        setDeck(ids);
        setIndex(0);
        setRevealed(false);
        setResults([]);
        setPhase("session");
      },
      () => setPhase("error"),
    );
  };

  const current = phase === "session" ? bank.get(deck[index]) : undefined;

  const grade = useCallback(
    (g: Grade) => {
      if (!current) return;
      review(current.id, g);
      setResults((r) => [...r, g]);
      setRevealed(false);
      if (index + 1 >= deck.length) setPhase("summary");
      else setIndex((i) => i + 1);
    },
    [current, deck.length, index, review],
  );

  useEffect(() => {
    if (phase !== "session") return;
    const onKey = (e: KeyboardEvent) => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement).tagName) || e.metaKey || e.ctrlKey)
        return;
      if (!revealed && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed && ["1", "2", "3", "4"].includes(e.key)) {
        grade((Number(e.key) - 1) as Grade);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, revealed, grade]);

  if (manifestError)
    return (
      <p className="text-sm text-danger">
        Could not load the question index. Check your connection and reload.
      </p>
    );
  if (!manifest || !hydrated) return <Skeleton className="h-96" />;

  // ---------- Session ----------
  if (phase === "session" && current) {
    const preview = (g: Grade) => formatInterval(schedule(questions[current.id]?.srs, g, now), now);
    return (
      <div>
        <div className="mb-5 flex items-center gap-3">
          <ProgressBar value={index} max={deck.length} className="flex-1" />
          <span className="text-xs tabular-nums text-muted">
            {index + 1} / {deck.length}
          </span>
          <button
            type="button"
            onClick={() => setPhase("summary")}
            aria-label="End session"
            className="rounded-lg p-1.5 text-muted hover:bg-raised"
          >
            <X className="size-4" />
          </button>
        </div>

        <article key={current.id} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] text-muted">{current.id}</span>
            <LevelBadge level={current.level} />
            <KindBadge kind={current.kind} type={current.scenarioType} />
            <span className="text-xs text-muted">{current.subtopic}</span>
          </div>
          <QuestionBody question={current} revealed={revealed} />
        </article>

        <div className="sticky bottom-20 mt-5 lg:bottom-4">
          {!revealed ? (
            <button type="button" onClick={() => setRevealed(true)} className={`${btnPrimary} w-full py-3`}>
              <Eye className="size-4" aria-hidden /> Show answer{" "}
              <kbd className="ml-1 rounded bg-white/20 px-1.5 text-[10px]">Space</kbd>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-surface p-2 shadow-card sm:grid-cols-4">
              {([0, 1, 2, 3] as Grade[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => grade(g)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-center transition-colors",
                    GRADE_STYLE[g],
                  )}
                >
                  <span className="block text-sm font-semibold">{GRADE_LABELS[g]}</span>
                  <span className="block text-[11px] opacity-80">
                    {preview(g)} · key {g + 1}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------- Summary ----------
  if (phase === "summary") {
    const count = (g: Grade) => results.filter((r) => r === g).length;
    const recalled = count(2) + count(3);
    return (
      <div>
        <PageHeader
          title="Session complete"
          subtitle={`${results.length} reviewed · ${recalled} recalled well`}
        />
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([0, 1, 2, 3] as Grade[]).map((g) => (
            <div key={g} className={cn("rounded-2xl border bg-surface p-4", GRADE_STYLE[g].split(" ")[0])}>
              <p className="text-2xl font-semibold tabular-nums">{count(g)}</p>
              <p className="text-xs text-muted">{GRADE_LABELS[g]}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setPhase("setup")} className={btnPrimary}>
            <RotateCcw className="size-4" aria-hidden /> Another session
          </button>
          <Link href="/" className={btn}>
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "loading") return <Skeleton className="h-96" />;
  if (phase === "error") {
    return (
      <div className="rounded-2xl border border-danger/40 bg-danger-soft p-5 text-sm">
        Could not load the questions for this session.{" "}
        <button type="button" onClick={() => setPhase("setup")} className="font-semibold underline">
          Back to setup
        </button>
      </div>
    );
  }

  // ---------- Setup ----------
  const toggleLevel = (l: Level) =>
    setOpts((o) => ({
      ...o,
      levels: o.levels.includes(l) ? o.levels.filter((x) => x !== l) : [...o.levels, l],
    }));

  return (
    <div>
      <PageHeader
        title="Practice"
        subtitle="Answer out loud, reveal, then grade yourself. Hard questions come back sooner."
      />

      <div className="space-y-6 rounded-2xl border border-line bg-surface p-5 shadow-card">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">What to practice</legend>
          <div className="flex flex-wrap gap-1.5">
            {SOURCES.map((s) => (
              <Chip
                key={s.id}
                active={opts.source === s.id}
                onClick={() => setOpts((o) => ({ ...o, source: s.id }))}
              >
                {s.label}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">{SOURCES.find((s) => s.id === opts.source)?.hint}</p>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Topic</span>
            <select
              value={opts.scope}
              onChange={(e) => setOpts((o) => ({ ...o, scope: e.target.value }))}
              className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
            >
              <option value="all">All topics</option>
              {nav.tracks.map((track) =>
                track.sections.map((section) => (
                  <optgroup key={`${track.id}/${section.name}`} label={`${track.id} · ${section.name}`}>
                    {section.topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </optgroup>
                )),
              )}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Session size</span>
            <select
              value={opts.size}
              onChange={(e) => setOpts((o) => ({ ...o, size: Number(e.target.value) }))}
              className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm"
            >
              {[10, 20, 30, 50].map((n) => (
                <option key={n} value={n}>
                  {n} questions
                </option>
              ))}
            </select>
          </label>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Level</legend>
          <div className="flex flex-wrap gap-1.5">
            {([1, 2, 3] as Level[]).map((l) => (
              <Chip key={l} active={opts.levels.includes(l)} onClick={() => toggleLevel(l)}>
                {LEVEL_INFO[l].short} · {LEVEL_INFO[l].name}
              </Chip>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Type</legend>
          <div className="flex gap-1.5">
            {(["all", "concept", "scenario"] as (Kind | "all")[]).map((k) => (
              <Chip key={k} active={opts.kind === k} onClick={() => setOpts((o) => ({ ...o, kind: k }))}>
                {k === "all" ? "Both" : k === "concept" ? "Concept" : "Scenario"}
              </Chip>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <p className="text-sm text-muted">
            <span className="font-semibold text-ink tabular-nums">{Math.min(available, opts.size)}</span>{" "}
            questions in this session
            {available > opts.size && ` (${available} match)`}
          </p>
          <button type="button" onClick={start} disabled={available === 0} className={btnPrimary}>
            Start <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
        {available === 0 && (
          <p className="text-xs text-muted">
            Nothing matches. Try “Smart mix” or “New”, or widen the level and type filters.
          </p>
        )}
      </div>
    </div>
  );
}
