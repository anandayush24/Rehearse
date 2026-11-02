import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { QuestionPage } from "@/components/question-page";
import { getManifest, getTopic } from "@/lib/data";

export const dynamicParams = false;

function locate(id: string) {
  const topic = getManifest().topics.find((t) => t.questions.some((q) => q.id === id));
  if (!topic) return null;
  const index = topic.questions.findIndex((q) => q.id === id);
  return { topic, index };
}

export function generateStaticParams() {
  return getManifest().topics.flatMap((t) => t.questions.map((q) => ({ id: q.id })));
}

export async function generateMetadata({ params }: PageProps<"/q/[id]">): Promise<Metadata> {
  const { id } = await params;
  const found = locate(id);
  if (!found) return {};
  const q = found.topic.questions[found.index];
  return { title: `${q.id} · ${q.subtopic}`, description: `${found.topic.title}: ${q.subtopic}` };
}

export default async function QuestionRoute({ params }: PageProps<"/q/[id]">) {
  const { id } = await params;
  const found = locate(id);
  if (!found) notFound();
  const { topic, index } = found;
  const data = getTopic(topic.id);
  const neighbour = (i: number) => {
    const q = topic.questions[i];
    return q ? { id: q.id, subtopic: q.subtopic } : undefined;
  };
  return (
    <QuestionPage
      question={data.questions[index]}
      topicId={topic.id}
      topicTitle={topic.title}
      prev={neighbour(index - 1)}
      next={neighbour(index + 1)}
    />
  );
}
