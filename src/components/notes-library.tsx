import { BookOpen } from "lucide-react";
import Link from "next/link";

import { CATEGORIES, type Category } from "@/content/categories";
import { getManifest, getTopic } from "@/lib/data";

/** Master notes grouped track → topic. Pass a category for one subject, or nothing for every subject. */
export function NotesLibrary({ category }: { category?: Category }) {
  const m = getManifest();
  const cats = category ? [category] : CATEGORIES;
  return (
    <div>
      {cats.map((cat) => {
        const tracks = m.tracks
          .filter((t) => cat.tracks.includes(t.id))
          .map((t) => ({ ...t, topics: m.topics.filter((x) => x.track === t.id && x.hasNotes) }))
          .filter((t) => t.topics.length);
        if (!tracks.length && !category) return null;
        return (
          <section key={cat.id} className="mb-10">
            {!category && (
              <h2 className="mb-4 text-lg font-semibold tracking-tight">
                <Link href={`/c/${cat.id}/notes/`} className="hover:text-accent-ink">
                  {cat.label}
                </Link>
              </h2>
            )}
            {!tracks.length && (
              <p className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">
                {cat.label} notes are coming soon.
              </p>
            )}
            {tracks.map((t) => (
              <div key={t.id} className="mb-8">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-accent-ink">
                  <span className="mr-2 font-mono text-muted">{t.id}</span>
                  {t.title}
                </h3>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-3">
                  {t.topics.map((x) => {
                    const sections = getTopic(x.id).notes?.length ?? 0;
                    return (
                      <div
                        key={x.id}
                        className="flex flex-col rounded-2xl border border-line bg-surface p-4 shadow-card"
                      >
                        <Link href={`/notes/${x.id}/`} className="group flex items-start gap-3">
                          <BookOpen className="mt-0.5 size-4 shrink-0 text-accent-ink" aria-hidden />
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold group-hover:text-accent-ink">
                              {x.title}
                            </span>
                            <span className="text-xs text-muted">
                              {sections} sections · {x.questions.length} questions
                            </span>
                          </span>
                        </Link>
                        <div className="mt-3 flex gap-4 pl-7 text-xs font-medium">
                          <Link href={`/notes/${x.id}/`} className="text-accent-ink hover:underline">
                            Read notes
                          </Link>
                          {x.questions.length > 0 && (
                            <Link href={`/topics/${x.id}/`} className="text-muted hover:text-ink">
                              Questions →
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
