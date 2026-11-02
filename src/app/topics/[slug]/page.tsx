import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TopicView } from "@/components/topic-view";
import { getManifest, getTopic } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return getManifest().topics.map((t) => ({ slug: t.id }));
}

export async function generateMetadata({ params }: PageProps<"/topics/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const meta = getManifest().topics.find((t) => t.id === slug);
  return meta
    ? { title: meta.title, description: `${meta.questions.length} interview questions on ${meta.title}.` }
    : {};
}

export default async function TopicPage({ params }: PageProps<"/topics/[slug]">) {
  const { slug } = await params;
  const meta = getManifest().topics.find((t) => t.id === slug);
  if (!meta) notFound();
  return <TopicView topic={getTopic(slug)} section={meta.section} />;
}
