"use client";

import { CornerDownLeft, Search } from "lucide-react";
import MiniSearch from "minisearch";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { useNav } from "@/components/nav-provider";
import { cn } from "@/components/ui";
import type { SearchDoc } from "@/content/types";
import { loadSearchDocs } from "@/lib/client-data";

interface Result {
  key: string;
  href: string;
  title: string;
  meta: string;
  kind: "topic" | "question";
}

function buildIndex(docs: SearchDoc[]) {
  const index = new MiniSearch<SearchDoc>({
    fields: ["id", "title", "text"],
    storeFields: ["id", "topic", "title"],
    searchOptions: { prefix: true, fuzzy: 0.2, boost: { id: 4, title: 2 } },
  });
  index.addAll(docs);
  return index;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { topics, topicById } = useNav();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open || docs) return;
    loadSearchDocs().then(setDocs, () => setDocs([]));
  }, [open, docs]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const index = useMemo(() => (docs ? buildIndex(docs) : null), [docs]);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    const topicHits: Result[] = topics
      .filter((t) => !q || `${t.title} ${t.code}`.toLowerCase().includes(q))
      .slice(0, q ? 5 : 8)
      .map((t) => ({
        key: `t:${t.id}`,
        href: `/topics/${t.id}/`,
        title: t.title,
        meta: `Topic · ${t.num} ${t.code} · ${t.qids.length} questions`,
        kind: "topic",
      }));
    if (!q || !index) return topicHits;
    const questionHits: Result[] = index
      .search(q)
      .slice(0, 12)
      .map((hit) => ({
        key: `q:${hit.id}`,
        href: `/q/${hit.id}/`,
        title: String(hit.title),
        meta: `${hit.id} · ${topicById.get(String(hit.topic))?.title ?? ""}`,
        kind: "question",
      }));
    return [...topicHits, ...questionHits];
  }, [query, index, topics, topicById]);

  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  const go = (r: Result | undefined) => {
    if (!r) return;
    onClose();
    setQuery("");
    router.push(r.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh]"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-card"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-4 text-muted" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Search questions and topics…"
            aria-label="Search questions and topics"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            aria-activedescendant={results[active] ? `palette-${results[active].key}` : undefined}
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
          />
          <kbd className="rounded border border-line px-1.5 py-0.5 text-[10px] text-muted">Esc</kbd>
        </div>
        <ul
          id="palette-results"
          ref={listRef}
          role="listbox"
          className="scroll-thin max-h-[50vh] overflow-y-auto p-2"
        >
          {results.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-muted">
              {query && !docs ? "Loading index…" : "No matches."}
            </li>
          )}
          {results.map((r, i) => (
            <li
              key={r.key}
              id={`palette-${r.key}`}
              role="option"
              aria-selected={i === active}
              onMouseMove={() => setActive(i)}
              onClick={() => go(r)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5",
                i === active && "bg-accent-soft",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.title}</p>
                <p className="truncate text-xs text-muted">{r.meta}</p>
              </div>
              {i === active && <CornerDownLeft className="size-3.5 text-accent-ink" aria-hidden />}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
