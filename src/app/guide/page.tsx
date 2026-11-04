import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";

import { renderMarkdown } from "@/content/render";

export const metadata: Metadata = { title: "Claude Developer: Study Guide" };

// shortcut: a copy of ../D1/summary.md (the notes folder is not in the repo); re-copy it when the notes change.
export default async function GuidePage() {
  const md = await readFile(path.join(process.cwd(), "content", "d1-summary.md"), "utf8");
  const html = await renderMarkdown(md);
  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-ink">Certifications</p>
      <h1 className="mb-1 text-2xl font-bold">Claude Developer: Study Guide</h1>
      <p className="mb-6 text-sm text-muted">
        Summary of the course material. Practice it in{" "}
        <Link href="/c/certifications/" className="underline">
          Certifications → Claude Developer
        </Link>
        .
      </p>
      <div className="prose-notes" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}
