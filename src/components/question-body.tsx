"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";

import { cn } from "@/components/ui";
import type { Question } from "@/content/types";

/** Sections that start open; the rest are one click away so a long answer stays scannable. */
const OPEN_BY_DEFAULT = new Set(["short", "strong", "weak", "why", "deep"]);

function Prose({ html }: { html: string }) {
  return <div className="prose-notes" dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * The question itself plus its answer sections. With `revealed` false only the prompt shows,
 * which is what recall mode and practice cards use before the reader has answered.
 */
export function QuestionBody({ question, revealed }: { question: Question; revealed: boolean }) {
  const [open, setOpen] = useState<Set<string>>(
    () =>
      new Set(question.sections.map((s, i) => (OPEN_BY_DEFAULT.has(s.key) ? `${i}` : "")).filter(Boolean)),
  );
  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(`${i}`)) next.add(`${i}`);
      return next;
    });

  return (
    <div className="space-y-5">
      {question.contextHtml && (
        <div className="rounded-xl border border-line bg-raised/60 p-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Scenario</p>
          <Prose html={question.contextHtml} />
        </div>
      )}

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent-ink">Question</p>
        <div className="text-[1.02rem] font-medium">
          <Prose html={question.promptHtml} />
        </div>
      </div>

      {revealed && (
        <div className="space-y-2">
          {question.sections.map((s, i) => {
            const isOpen = open.has(`${i}`);
            const id = `${question.id}-s${i}`;
            return (
              <section key={id} className="rounded-xl border border-line bg-surface">
                <h3>
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    aria-expanded={isOpen}
                    aria-controls={id}
                    className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-semibold hover:bg-raised/60"
                  >
                    <ChevronRight
                      className={cn("size-4 shrink-0 text-muted transition-transform", isOpen && "rotate-90")}
                      aria-hidden
                    />
                    {s.label}
                  </button>
                </h3>
                {isOpen && (
                  <div id={id} className="border-t border-line px-4 py-4">
                    <Prose html={s.html} />
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
