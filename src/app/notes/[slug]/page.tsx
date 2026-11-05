import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

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
  for (const q of topic.questions) if (q.notes) bySection.set(q.notes, [...(bySection.get(q.notes) ?? []), q.id]);

  return (
    <article className="w-full">
      <p className="mb-2 text-xs font-medium text-muted">
        <Link href="/notes/" className="hover:text-ink">
          Notes
        </Link>{" "}
        / {meta.section}
      </p>
      <h1 className="mb-1 text-2xl font-bold">{topic.title}: master notes</h1>
      <p className="mb-5 text-sm text-muted">
        Read this first.{" "}
        <Link href={`/topics/${topic.id}/`} className="underline">
          Then grind the {topic.questions.length} questions
        </Link>
        .
      </p>
      <nav aria-label="Sections" className="mb-8 rounded-2xl border border-line bg-surface p-4 text-sm">
        <ol className="list-decimal space-y-1 pl-5">
          {topic.notes?.map((n) => (
            <li key={n.id}>
              <a href={`#${n.id}`} className="hover:text-accent-ink">
                {n.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      {topic.notes?.map((n) => (
        <section key={n.id} id={n.id} className="mb-10 scroll-mt-20">
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
  );
}
