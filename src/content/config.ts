/** Display names for tracks and for the letter in a chunk file name (`01_K1a_p1.md` → K). */
export interface TrackConfig {
  title: string;
  sections: Record<string, string>;
}

export const TRACKS: Record<string, TrackConfig> = {
  A1: {
    title: "Kotlin, Coroutines & Flow",
    sections: {
      K: "Kotlin",
      C: "Coroutines",
      F: "Flow",
      T: "Testing",
      X: "Cross-cutting",
    },
  },
  A2: {
    title: "Android Internals & Platform",
    sections: {
      L: "Lifecycle",
      P: "Process & state",
      M: "Main thread & Looper",
      S: "Components",
      I: "Intents & tasks",
      R: "Runtime & memory",
      E: "Permissions",
      V: "Platform versions",
      B: "Background limits",
      N: "App environment",
      X: "Cross-cutting",
    },
  },
};

export function trackConfig(track: string): TrackConfig {
  return TRACKS[track] ?? { title: track, sections: {} };
}
