"use client";

import { BarChart3, BookOpen, Bookmark, ChevronRight, GraduationCap, LayoutDashboard, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { cn } from "@/components/ui";
import { useActiveCategory } from "@/components/category-bar";
import { useNav } from "@/components/nav-provider";
import { categoryById } from "@/content/categories";
import { isDue } from "@/lib/srs";
import { useHydrated, useStore } from "@/lib/store";
import { useNow } from "@/lib/use-now";

const PRIMARY = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/notes/", label: "Notes", icon: BookOpen },
  { href: "/practice/", label: "Practice", icon: GraduationCap },
  { href: "/saved/", label: "Saved", icon: Bookmark },
  { href: "/stats/", label: "Stats", icon: BarChart3 },
  { href: "/settings/", label: "Settings", icon: Settings },
] as const;

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { nav } = useNav();
  const pathname = usePathname();
  const questions = useStore((s) => s.questions);
  const hydrated = useHydrated();
  const category = categoryById(useActiveCategory() ?? "");
  const tracks = category ? nav.tracks.filter((t) => category.tracks.includes(t.id)) : nav.tracks;
  const activeTopic = /^\/topics\/([^/]+)/.exec(pathname)?.[1];
  const [closed, setClosed] = useState<Set<string>>(new Set());

  const toggle = (key: string) =>
    setClosed((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  const now = useNow();

  return (
    <nav aria-label="Primary" className="flex h-full flex-col">
      <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5 px-5 py-4">
        <span className="grid size-8 place-items-center rounded-lg bg-accent text-sm font-bold text-accent-fg">
          R
        </span>
        <span className="text-[15px] font-semibold tracking-tight">Rehearse</span>
      </Link>

      <ul className="space-y-0.5 px-3">
        {PRIMARY.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-accent-soft text-accent-ink" : "text-muted hover:bg-raised hover:text-ink",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="scroll-thin mt-4 min-h-0 flex-1 overflow-y-auto border-t border-line px-3 pb-6 pt-3">
        {tracks.map((track) => (
          <div key={track.id} className="mb-4">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
              {track.id} · {track.title}
            </p>
            {track.sections.map((section) => {
              const key = `${track.id}/${section.name}`;
              const open = !closed.has(key) || section.topics.some((t) => t.id === activeTopic);
              return (
                <div key={key}>
                  <button
                    type="button"
                    onClick={() => toggle(key)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-1.5 rounded-md px-3 py-1.5 text-left text-xs font-semibold text-accent-ink hover:bg-raised"
                  >
                    <ChevronRight
                      className={cn("size-3.5 transition-transform", open && "rotate-90")}
                      aria-hidden
                    />
                    {section.name}
                  </button>
                  {open && (
                    <ul>
                      {section.topics.map((t) => {
                        const done = hydrated ? t.qids.filter((q) => questions[q]?.done).length : 0;
                        const due = hydrated ? t.qids.filter((q) => isDue(questions[q]?.srs, now)).length : 0;
                        const active = t.id === activeTopic;
                        return (
                          <li key={t.id}>
                            <Link
                              href={`/topics/${t.id}/`}
                              onClick={onNavigate}
                              aria-current={active ? "page" : undefined}
                              className={cn(
                                "flex items-baseline gap-2 rounded-md py-1.5 pl-8 pr-3 text-[13px] leading-snug transition-colors",
                                active ? "bg-accent-soft font-medium text-accent-ink" : "hover:bg-raised",
                              )}
                            >
                              <span className="min-w-0 flex-1">{t.title}</span>
                              {due > 0 && (
                                <span
                                  className="rounded-full bg-warn-soft px-1.5 text-[10px] font-semibold text-warn"
                                  title={`${due} due for review`}
                                >
                                  {due}
                                </span>
                              )}
                              <span className="shrink-0 text-[11px] tabular-nums text-muted">
                                {done}/{t.qids.length}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
