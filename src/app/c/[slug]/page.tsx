import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Dashboard } from "@/components/dashboard";
import { CATEGORIES, categoryById } from "@/content/categories";

export const dynamicParams = false;

export const generateStaticParams = () => CATEGORIES.map((c) => ({ slug: c.id }));

export async function generateMetadata({ params }: PageProps<"/c/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: categoryById(slug)?.label };
}

export default async function CategoryPage({ params }: PageProps<"/c/[slug]">) {
  const { slug } = await params;
  if (!categoryById(slug)) notFound();
  return <Dashboard category={slug} />;
}
