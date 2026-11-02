"use client";

import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { useNav } from "@/components/nav-provider";
import { PageHeader, Skeleton, btn, cn } from "@/components/ui";
import { parseExport, serializeExport, type Settings, type Theme } from "@/lib/state";
import { useHydrated, useStore } from "@/lib/store";

const THEMES: { id: Theme; label: string; swatch: string }[] = [
  { id: "system", label: "System", swatch: "linear-gradient(135deg,#f7f7f5 50%,#0e1014 50%)" },
  { id: "light", label: "Light", swatch: "#f7f7f5" },
  { id: "dark", label: "Dark", swatch: "#0e1014" },
  { id: "sepia", label: "Sepia", swatch: "#f4ecd8" },
];

const FONT_SIZES: { id: Settings["fontScale"]; label: string }[] = [
  { id: 0, label: "Small" },
  { id: 1, label: "Medium" },
  { id: 2, label: "Large" },
];

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <h2 className="text-sm font-semibold">{title}</h2>
      {hint && <p className="mb-3 mt-1 text-xs text-muted">{hint}</p>}
      {!hint && <div className="mb-3" />}
      {children}
    </section>
  );
}

export function SettingsView() {
  const { nav, topics } = useNav();
  const hydrated = useHydrated();
  const settings = useStore((s) => s.settings);
  const setSetting = useStore((s) => s.setSetting);
  const importProgress = useStore((s) => s.importProgress);
  const resetProgress = useStore((s) => s.resetProgress);
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!hydrated) return <Skeleton className="h-96" />;

  const exportData = () => {
    const { questions, reviews, settings: s, lastTopic, lastQuestion } = useStore.getState();
    const blob = new Blob([serializeExport({ questions, reviews, settings: s, lastTopic, lastQuestion })], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rehearse-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ ok: true, text: "Progress exported." });
  };

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      importProgress(parseExport(await file.text()));
      setMessage({ ok: true, text: "Progress imported. Your previous progress was replaced." });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Import failed." });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const questionCount = topics.reduce((n, t) => n + t.qids.length, 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" />

      <Section title="Theme">
        <div role="radiogroup" aria-label="Theme" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={settings.theme === t.id}
              onClick={() => setSetting("theme", t.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                settings.theme === t.id
                  ? "border-accent bg-accent-soft text-accent-ink"
                  : "border-line hover:border-accent",
              )}
            >
              <span
                className="size-5 rounded-full border border-line"
                style={{ background: t.swatch }}
                aria-hidden
              />
              {t.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Text size">
        <div role="radiogroup" aria-label="Text size" className="flex gap-2">
          {FONT_SIZES.map((f) => (
            <button
              key={f.id}
              type="button"
              role="radio"
              aria-checked={settings.fontScale === f.id}
              onClick={() => setSetting("fontScale", f.id)}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                settings.fontScale === f.id
                  ? "border-accent bg-accent-soft text-accent-ink"
                  : "border-line hover:border-accent",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Section>

      <Section
        title="Recall mode"
        hint="Hide the answers until you press Reveal, so you try to answer before reading."
      >
        <button
          type="button"
          role="switch"
          aria-checked={settings.recall}
          onClick={() => setSetting("recall", !settings.recall)}
          className="flex items-center gap-3 text-sm font-medium"
        >
          <span
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors",
              settings.recall ? "bg-accent" : "bg-raised",
            )}
          >
            <span
              className={cn(
                "absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform",
                settings.recall && "translate-x-5",
              )}
            />
          </span>
          {settings.recall ? "On" : "Off"}
        </button>
      </Section>

      <Section
        title="Your data"
        hint="Progress lives only in this browser. Export a copy to back it up or move it to another device."
      >
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportData} className={btn}>
            <Download className="size-4" aria-hidden /> Export progress
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className={btn}>
            <Upload className="size-4" aria-hidden /> Import progress
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Import progress file"
            onChange={(e) => onImport(e.target.files?.[0])}
          />
          {confirmReset ? (
            <span className="inline-flex items-center gap-2 rounded-lg border border-danger/40 bg-danger-soft px-3 py-1.5 text-sm">
              Erase all progress?
              <button
                type="button"
                className="font-semibold text-danger underline"
                onClick={() => {
                  resetProgress();
                  setConfirmReset(false);
                  setMessage({ ok: true, text: "Progress erased." });
                }}
              >
                Yes, erase
              </button>
              <button type="button" className="font-medium underline" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className={cn(btn, "text-danger hover:border-danger hover:text-danger")}
            >
              Reset progress
            </button>
          )}
        </div>
        {message && (
          <p role="status" className={cn("mt-3 text-sm", message.ok ? "text-success" : "text-danger")}>
            {message.text}
          </p>
        )}
      </Section>

      <Section title="About">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
          <dt className="text-muted">Content</dt>
          <dd>
            {questionCount} questions · {topics.length} topics · {nav.tracks.length} tracks
          </dd>
          <dt className="text-muted">Content version</dt>
          <dd className="font-mono text-xs">{nav.contentHash}</dd>
          <dt className="text-muted">Shortcuts</dt>
          <dd>
            <kbd className="rounded border border-line px-1.5 text-xs">Ctrl K</kbd> or{" "}
            <kbd className="rounded border border-line px-1.5 text-xs">/</kbd> search ·{" "}
            <kbd className="rounded border border-line px-1.5 text-xs">Space</kbd> reveal ·{" "}
            <kbd className="rounded border border-line px-1.5 text-xs">1–4</kbd> grade
          </dd>
        </dl>
      </Section>
    </div>
  );
}
