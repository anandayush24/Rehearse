import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NotesLibrary } from "@/components/notes-library";
import { SubjectTabs } from "@/components/subject-tabs";
import { CATEGORIES, categoryById } from "@/content/categories";

export const dynamicParams = false;

export const generateStaticParams = () => CATEGORIES.map((c) => ({ slug: c.id }));

export async function generateMetadata({ params }: PageProps<"/c/[slug]/notes">): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${categoryById(slug)?.label} notes` };
}

export default async function CategoryNotesPage({ params }: PageProps<"/c/[slug]/notes">) {
  const { slug } = await params;
  const cat = categoryById(slug);
  if (!cat) notFound();
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold tracking-tight sm:text-3xl">{cat.label}</h1>
      <SubjectTabs category={cat.id} active="notes" />
      <NotesLibrary category={cat} />
    </div>
  );
}
