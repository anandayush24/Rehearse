import Link from "next/link";

import { cn } from "@/components/ui";

/** Questions | Notes switch shown at the top of a subject's pages. */
export function SubjectTabs({ category, active }: { category: string; active: "questions" | "notes" }) {
  const tabs = [
    { id: "questions", label: "Questions", href: `/c/${category}/` },
    { id: "notes", label: "Notes", href: `/c/${category}/notes/` },
  ] as const;
  return (
    <div
      role="tablist"
      aria-label="Section"
      className="mb-6 inline-flex rounded-xl border border-line bg-surface p-1"
    >
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          role="tab"
          aria-selected={active === t.id}
          className={cn(
            "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
            active === t.id ? "bg-accent text-accent-fg" : "text-muted hover:text-ink",
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
