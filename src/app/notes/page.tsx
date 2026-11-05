import type { Metadata } from "next";
import Link from "next/link";

import { NotesLibrary } from "@/components/notes-library";

export const metadata: Metadata = { title: "Notes" };

export default function NotesIndex() {
  return (
    <div className="w-full">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight sm:text-3xl">Master notes</h1>
      <p className="mb-8 text-sm text-muted">Read the notes for a topic, then drill its questions.</p>
      <NotesLibrary />
      <p className="text-sm">
        <Link href="/guide/" className="underline">
          Claude Developer one-page cheat sheet
        </Link>
      </p>
    </div>
  );
}
