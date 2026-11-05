"use client";

import { BarChart3, Bookmark, GraduationCap, LayoutDashboard, Menu, Search, Settings, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { CategoryBar } from "@/components/category-bar";
import { CommandPalette } from "@/components/command-palette";
import { Sidebar } from "@/components/sidebar";
import { cn } from "@/components/ui";
import { syncTabs, useHydrated, useStore } from "@/lib/store";

const BOTTOM_NAV = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/practice/", label: "Practice", icon: GraduationCap },
  { href: "/saved/", label: "Saved", icon: Bookmark },
  { href: "/stats/", label: "Stats", icon: BarChart3 },
  { href: "/settings/", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const settings = useStore((s) => s.settings);
  const hydrated = useHydrated();
  const [drawer, setDrawer] = useState<string | null>(null); // pathname the drawer was opened on
  const [palette, setPalette] = useState(false);
  const drawerOpen = drawer === pathname; // navigating closes it without an effect

  useEffect(() => syncTabs(), []);

  // Apply theme and text size once saved settings are loaded (the inline script handled first paint).
  useEffect(() => {
    if (!hydrated) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const theme = settings.theme === "system" ? (mq.matches ? "dark" : "light") : settings.theme;
      document.documentElement.dataset.theme = theme;
      document.documentElement.dataset.font = String(settings.fontScale);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [hydrated, settings.theme, settings.fontScale]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement).tagName);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((v) => !v);
      } else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setPalette(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/sw.js`).catch(() => {
        /* offline support is an enhancement */
      });
    }
  }, []);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[19rem_minmax(0,1fr)]">
      <a
        href="#main"
        className="sr-only z-[60] rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-fg focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-dvh border-r border-line bg-surface lg:block">
        <Sidebar />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Topics">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(null)} />
          <div className="absolute inset-y-0 left-0 w-[85vw] max-w-sm bg-surface shadow-card">
            <button
              type="button"
              onClick={() => setDrawer(null)}
              aria-label="Close menu"
              className="absolute right-3 top-3 rounded-lg p-2 text-muted hover:bg-raised"
            >
              <X className="size-5" />
            </button>
            <Sidebar onNavigate={() => setDrawer(null)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur">
          <div className="flex h-14 items-center gap-2 px-3 sm:px-6">
            <button
              type="button"
              onClick={() => setDrawer(pathname)}
              aria-label="Open topics"
              className="rounded-lg p-2 text-muted hover:bg-raised lg:hidden"
            >
              <Menu className="size-5" />
            </button>
            <Link href="/" className="text-sm font-semibold tracking-tight lg:hidden">
              Rehearse
            </Link>
            <button
              type="button"
              onClick={() => setPalette(true)}
              className="ml-auto flex h-9 w-full max-w-xs items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-muted transition-colors hover:border-accent sm:max-w-sm"
            >
              <Search className="size-4" aria-hidden />
              <span className="flex-1 truncate text-left">Search questions…</span>
              <kbd className="hidden rounded border border-line px-1.5 py-0.5 text-[10px] sm:inline">
                Ctrl K
              </kbd>
            </button>
          </div>
          <CategoryBar />
        </header>

        <main
          id="main"
          tabIndex={-1}
          className="w-full flex-1 px-4 pb-28 pt-6 outline-none sm:px-6 lg:pb-12 lg:pt-8"
        >
          {children}
        </main>

        <nav
          aria-label="Quick navigation"
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
        >
          {BOTTOM_NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                  active ? "text-accent-ink" : "text-muted",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}
