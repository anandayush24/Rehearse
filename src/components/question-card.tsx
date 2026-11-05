"use client";

import { BookOpen, Bookmark, Check, ChevronDown, Eye, Link2, StickyNote } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { QuestionBody } from "@/components/question-body";
import { KindBadge, LevelBadge, cn } from "@/components/ui";
import type { Question } from "@/content/types";
import { isDue } from "@/lib/srs";
import { useHydrated, useStore } from "@/lib/store";
import { useNow } from "@/lib/use-now";

interface Props {
  question: Question;
  open: boolean;
  /** When provided the header toggles the card (topic list). Omit for the standalone question page. */
  onToggle?: () => void;
}

const action =
  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors";

export function QuestionCard({ question, open, onToggle }: Props) {
  const state = useStore((s) => s.questions[question.id]);
  const hydrated = useHydrated();
  const recall = useStore((s) => s.settings.recall) && hydrated;
  const now = useNow();
  const toggleDone = useStore((s) => s.toggleDone);
  const toggleSaved = useStore((s) => s.toggleSaved);
  const setNote = useStore((s) => s.setNote);

  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [copied, setCopied] = useState(false);

  const revealed = !recall || revealedId === question.id;
  const done = hydrated && !!state?.done;
  const saved = hydrated && !!state?.saved;
  const due = hydrated && isDue(state?.srs, now);
  const hasNote = hydrated && !!state?.note;

  const copyLink = async () => {
    const url = `${location.origin}/q/${question.id}/`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard can be blocked; the address bar link still works */
    }
  };

  const header = (
    <>
      <span className="font-mono text-[11px] text-muted">{question.id}</span>
      <LevelBadge level={question.level} />
      <KindBadge kind={question.kind} type={question.scenarioType} />
      <span className="min-w-0 flex-1 text-left text-[15px] font-semibold leading-snug">
        {question.subtopic}
      </span>
      {due && (
        <span className="rounded-full bg-warn-soft px-2 py-0.5 text-[11px] font-semibold text-warn">Due</span>
      )}
      {hasNote && <StickyNote className="size-4 text-muted" aria-label="Has a note" />}
      {saved && <Bookmark className="size-4 fill-accent text-accent" aria-label="Saved" />}
      {done && <Check className="size-4 text-success" aria-label="Done" />}
    </>
  );

  return (
    <article
      id={question.id}
      className={cn(
        "scroll-mt-20 rounded-2xl border bg-surface shadow-card transition-colors",
        done ? "border-success/40" : "border-line",
      )}
    >
      {onToggle ? (
        <h2>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={`${question.id}-body`}
            className="flex w-full flex-wrap items-center gap-x-2.5 gap-y-1.5 rounded-2xl px-4 py-3.5 hover:bg-raised/50"
          >
            {header}
            <ChevronDown
              className={cn("size-4 shrink-0 text-muted transition-transform", open && "rotate-180")}
              aria-hidden
            />
          </button>
        </h2>
      ) : (
        <h1 className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 px-4 py-3.5">{header}</h1>
      )}

      {open && (
        <div id={`${question.id}-body`} className="space-y-5 border-t border-line px-4 py-5">
          <QuestionBody question={question} revealed={revealed} />

          {!revealed && (
            <button
              type="button"
              onClick={() => setRevealedId(question.id)}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg hover:brightness-110"
            >
              <Eye className="size-4" aria-hidden /> Reveal answer
            </button>
          )}

          <div className="flex flex-wrap gap-2 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => toggleDone(question.id)}
              aria-pressed={done}
              className={cn(
                action,
                done ? "border-success/50 bg-success-soft text-success" : "border-line hover:border-accent",
              )}
            >
              <Check className="size-3.5" aria-hidden /> {done ? "Done" : "Mark done"}
            </button>
            <button
              type="button"
              onClick={() => toggleSaved(question.id)}
              aria-pressed={saved}
              className={cn(
                action,
                saved ? "border-accent/50 bg-accent-soft text-accent-ink" : "border-line hover:border-accent",
              )}
            >
              <Bookmark className={cn("size-3.5", saved && "fill-current")} aria-hidden />{" "}
              {saved ? "Saved" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowNote((v) => !v)}
              aria-expanded={showNote}
              className={cn(action, "border-line hover:border-accent")}
            >
              <StickyNote className="size-3.5" aria-hidden /> {hasNote ? "Edit note" : "Add note"}
            </button>
            {question.notes && (
              <Link
                href={`/notes/${question.topic}/#${question.notes}`}
                className={cn(action, "border-line hover:border-accent")}
              >
                <BookOpen className="size-3.5" aria-hidden /> Source
              </Link>
            )}
            <button
              type="button"
              onClick={copyLink}
              className={cn(action, "border-line hover:border-accent")}
            >
              <Link2 className="size-3.5" aria-hidden /> {copied ? "Copied" : "Copy link"}
            </button>
          </div>

          {showNote && (
            <label className="block">
              <span className="sr-only">Your note on {question.id}</span>
              <textarea
                value={state?.note ?? ""}
                onChange={(e) => setNote(question.id, e.target.value)}
                rows={4}
                maxLength={5000}
                placeholder="Your own words, gotchas, or an example from your work. Saved in this browser."
                className="w-full resize-y rounded-xl border border-line bg-canvas p-3 text-sm outline-none focus:border-accent"
              />
            </label>
          )}
        </div>
      )}
    </article>
  );
}
