"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { useNav } from "@/components/nav-provider";
import { cn } from "@/components/ui";
import { CATEGORIES, categoryOfTrack } from "@/content/categories";

/** The category the current page belongs to, or undefined on pages that span all of them. */
export function useActiveCategory(): string | undefined {
  const pathname = usePathname();
  const { nav, topicOfQuestion } = useNav();
  const categoryOfTopic = useMemo(
    () =>
      new Map(
        nav.tracks.flatMap((track) =>
          track.sections.flatMap((s) => s.topics.map((t) => [t.id, categoryOfTrack(track.id)?.id] as const)),
        ),
      ),
    [nav],
  );
  const [, kind, id] = /^\/(c|topics|q|notes)\/([^/]+)/.exec(pathname) ?? [];
  if (kind === "c") return id;
  if (kind === "topics" || kind === "notes") return categoryOfTopic.get(id);
  if (kind === "q") return categoryOfTopic.get(topicOfQuestion.get(id) ?? "");
  return undefined;
}

export function CategoryBar() {
  const active = useActiveCategory();
  return (
    <nav aria-label="Subjects" className="scroll-thin flex gap-1 overflow-x-auto px-3 pb-2 sm:px-6">
      {CATEGORIES.map((c) => (
        <Link
          key={c.id}
          href={`/c/${c.id}/`}
          aria-current={active === c.id ? "page" : undefined}
          className={cn(
            "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
            active === c.id ? "bg-accent text-accent-fg" : "text-muted hover:bg-raised hover:text-ink",
          )}
        >
          {c.label}
        </Link>
      ))}
    </nav>
  );
}
