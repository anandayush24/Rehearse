"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { allTopics, type Nav, type NavTopic } from "@/lib/nav";

interface NavContextValue {
  nav: Nav;
  topics: NavTopic[];
  topicById: Map<string, NavTopic>;
  /** question id → topic id */
  topicOfQuestion: Map<string, string>;
}

const NavContext = createContext<NavContextValue | null>(null);

export function NavProvider({ nav, children }: { nav: Nav; children: ReactNode }) {
  const value = useMemo<NavContextValue>(() => {
    const topics = allTopics(nav);
    return {
      nav,
      topics,
      topicById: new Map(topics.map((t) => [t.id, t])),
      topicOfQuestion: new Map(topics.flatMap((t) => t.qids.map((q) => [q, t.id] as const))),
    };
  }, [nav]);
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav(): NavContextValue {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav must be used inside <NavProvider>");
  return ctx;
}
