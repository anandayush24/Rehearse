import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { categoryOfTrack } from "@/content/categories";
import { getManifest, getTopic } from "@/lib/data";

export const dynamicParams = false;

const withNotes = () => getManifest().topics.filter((t) => t.hasNotes);

// Static export fails on an empty param list, so fall back to one placeholder that 404s.
export const generateStaticParams = () => {
  const t = withNotes();
  return t.length ? t.map((x) => ({ slug: x.id })) : [{ slug: "none" }];
};

export async function generateMetadata({ params }: PageProps<"/notes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const meta = withNotes().find((t) => t.id === slug);
  return meta ? { title: `Notes: ${meta.title}` } : {};
}

export default async function NotesPage({ params }: PageProps<"/notes/[slug]">) {
  const { slug } = await params;
  const meta = withNotes().find((t) => t.id === slug);
  if (!meta) notFound();
  const topic = getTopic(slug);
  const bySection = new Map<string, string[]>();
  for (const q of topic.questions)
    if (q.notes) bySection.set(q.notes, [...(bySection.get(q.notes) ?? []), q.id]);

  const cat = categoryOfTrack(meta.track);
  const outline = topic.notes?.map((n) => (
    <li key={n.id}>
      <a href={`#${n.id}`} className="hover:text-accent-ink">
        {n.title}
      </a>
    </li>
  ));

  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_16rem] xl:gap-10">
      <article className="min-w-0">
        <p className="mb-2 text-xs font-medium text-muted">
          <Link href={cat ? `/c/${cat.id}/notes/` : "/notes/"} className="hover:text-ink">
            {cat ? `${cat.label} notes` : "Notes"}
          </Link>{" "}
          / {meta.section}
        </p>
        <h1 className="mb-1 text-2xl font-bold">{topic.title}: master notes</h1>
        <p className="mb-5 text-sm text-muted">
          Read this first.{" "}
          <Link href={`/topics/${topic.id}/`} className="underline">
            {topic.questions.length
              ? `Then grind the ${topic.questions.length} questions`
              : "Questions for this topic are coming next"}
          </Link>
          .
        </p>
        <nav
          aria-label="Sections"
          className="mb-8 rounded-2xl border border-line bg-surface p-4 text-sm xl:hidden"
        >
          <ol className="list-decimal space-y-1 pl-5">{outline}</ol>
        </nav>
        {topic.notes?.map((n) => (
          <section key={n.id} id={n.id} className="mb-10 scroll-mt-32">
            <h2 className="mb-3 text-xl font-semibold">{n.title}</h2>
            <div className="prose-notes" dangerouslySetInnerHTML={{ __html: n.html }} />
            {bySection.get(n.id) && (
              <p className="mt-4 text-xs text-muted">
                Practise this part:{" "}
                {bySection.get(n.id)!.map((id) => (
                  <Link key={id} href={`/q/${id}/`} className="mr-2 underline">
                    {id}
                  </Link>
                ))}
              </p>
            )}
          </section>
        ))}
      </article>
      <aside className="hidden xl:block">
        <nav aria-label="On this page" className="sticky top-32 text-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">On this page</p>
          <ol className="space-y-1.5 border-l border-line pl-4">{outline}</ol>
        </nav>
      </aside>
    </div>
  );
}
