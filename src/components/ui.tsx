import clsx, { type ClassValue } from "clsx";
import type { ReactNode } from "react";

import type { Kind, Level } from "@/content/types";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

export const LEVEL_INFO: Record<Level, { short: string; name: string; hint: string; tone: string }> = {
  1: {
    short: "L1",
    name: "Fundamentals",
    hint: "Expected of everyone",
    tone: "text-success bg-success-soft",
  },
  2: { short: "L2", name: "Mid-level", hint: "3–5 years of experience", tone: "text-warn bg-warn-soft" },
  3: { short: "L3", name: "Senior", hint: "Where senior offers are won", tone: "text-danger bg-danger-soft" },
};

const pill =
  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none tracking-wide";

export function LevelBadge({ level }: { level: Level }) {
  const info = LEVEL_INFO[level];
  return (
    <span className={cn(pill, info.tone)} title={`${info.name}: ${info.hint}`}>
      {info.short}
    </span>
  );
}

export function KindBadge({ kind, type }: { kind: Kind; type?: string }) {
  return (
    <span className={cn(pill, "bg-raised text-muted")}>
      {kind === "scenario" ? (type ?? "Scenario") : "Concept"}
    </span>
  );
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn(pill, "bg-accent-soft text-accent-ink", className)}>{children}</span>;
}

export function ProgressBar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("h-1.5 overflow-hidden rounded-full bg-raised", className)}
    >
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function ProgressRing({ value, max, size = 36 }: { value: number; max: number; size?: number }) {
  const r = (size - 5) / 2;
  const c = 2 * Math.PI * r;
  const frac = max ? value / max : 0;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${value} of ${max} done`}
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={3} className="stroke-raised" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={`${c * frac} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className={frac >= 1 ? "stroke-success" : "stroke-accent"}
      />
    </svg>
  );
}

export const btn =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent-ink disabled:pointer-events-none disabled:opacity-50";
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-accent-fg transition-[filter] hover:brightness-110 disabled:pointer-events-none disabled:opacity-50";

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-muted">{subtitle}</p>}
      </div>
      {children}
    </header>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-lg bg-raised", className)} />;
}
