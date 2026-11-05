import type { Metadata } from "next";
import Link from "next/link";

import { getManifest } from "@/lib/data";

export const metadata: Metadata = { title: "Notes" };

export default function NotesIndex() {
  const m = getManifest();
  const tracks = m.tracks
    .map((t) => ({ ...t, topics: m.topics.filter((x) => x.track === t.id && x.hasNotes) }))
    .filter((t) => t.topics.length);
  return (
    <div className="w-full">
      <h1 className="mb-1 text-2xl font-bold">Master notes</h1>
      <p className="mb-6 text-sm text-muted">Read the notes for a topic, then drill its questions. Only topics with notes are listed.</p>
      {tracks.map((t) => (
        <section key={t.id} className="mb-6">
          <h2 className="mb-2 font-semibold">{t.title}</h2>
          <ul className="space-y-1 text-sm">
            {t.topics.map((x) => (
              <li key={x.id}>
                <Link href={`/notes/${x.id}/`} className="hover:text-accent-ink">
                  {x.title} <span className="text-muted">({x.questions.length} questions)</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="text-sm">
        <Link href="/guide/" className="underline">
          Claude Developer one-page cheat sheet
        </Link>
      </p>
    </div>
  );
}
