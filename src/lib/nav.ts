import type { Manifest } from "@/content/types";

/**
 * A slim view of the manifest that every page ships with: enough for the sidebar and for
 * progress counts, without per-question metadata (that is fetched on demand).
 */

export interface NavTopic {
  id: string;
  num: string;
  code: string;
  title: string;
  qids: string[];
}
export interface NavSection {
  name: string;
  topics: NavTopic[];
}
export interface NavTrack {
  id: string;
  title: string;
  sections: NavSection[];
}
export interface Nav {
  contentHash: string;
  tracks: NavTrack[];
}

export function buildNav(manifest: Manifest): Nav {
  const byId = new Map(manifest.topics.map((t) => [t.id, t]));
  return {
    contentHash: manifest.contentHash,
    tracks: manifest.tracks.map((track) => ({
      id: track.id,
      title: track.title,
      sections: track.sections.map((s) => ({
        name: s.name,
        topics: s.topics.map((id) => {
          const t = byId.get(id)!;
          return { id, num: t.num, code: t.code, title: t.title, qids: t.questions.map((q) => q.id) };
        }),
      })),
    })),
  };
}

export const allTopics = (nav: Nav): NavTopic[] =>
  nav.tracks.flatMap((t) => t.sections.flatMap((s) => s.topics));
