"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { QuestionCard } from "@/components/question-card";
import { btn } from "@/components/ui";
import type { Question } from "@/content/types";
import { useStore } from "@/lib/store";

interface Neighbour {
  id: string;
  subtopic: string;
}

interface Props {
  question: Question;
  topicId: string;
  topicTitle: string;
  prev?: Neighbour;
  next?: Neighbour;
}

export function QuestionPage({ question, topicId, topicTitle, prev, next }: Props) {
  const visit = useStore((s) => s.visit);
  useEffect(() => visit(topicId, question.id), [visit, topicId, question.id]);

  return (
    <div>
      <p className="mb-3 text-xs font-medium text-muted">
        <Link href={`/topics/${topicId}/`} className="hover:text-ink">
          {topicTitle}
        </Link>{" "}
        / {question.id}
      </p>
      <QuestionCard question={question} open />
      <nav aria-label="Neighbouring questions" className="mt-6 flex items-stretch justify-between gap-3">
        {prev ? (
          <Link href={`/q/${prev.id}/`} className={`${btn} min-w-0 flex-1 justify-start`}>
            <ChevronLeft className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{prev.subtopic}</span>
          </Link>
        ) : (
          <span className="flex-1" />
        )}
        {next ? (
          <Link href={`/q/${next.id}/`} className={`${btn} min-w-0 flex-1 justify-end`}>
            <span className="truncate">{next.subtopic}</span>
            <ChevronRight className="size-4 shrink-0" aria-hidden />
          </Link>
        ) : (
          <span className="flex-1" />
        )}
      </nav>
    </div>
  );
}
