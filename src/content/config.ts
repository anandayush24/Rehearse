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
  B1: {
    title: "JVM, Java/Kotlin & Concurrency",
    sections: {
      J: "JVM memory & GC",
      M: "Memory model",
      T: "Threads & async",
      L: "Locks & collections",
      V: "Virtual threads",
      K: "Kotlin on the server",
      P: "Profiling",
      C: "Collections & language",
      X: "Cross-cutting",
    },
  },
  C1: {
    title: "GenAI Foundations",
    sections: {
      E: "Embeddings",
      K: "Tokenization",
      T: "Transformers",
      R: "Training",
      S: "Scaling",
      W: "Context windows",
      M: "Model selection",
      G: "Generation",
      X: "Cross-cutting",
    },
  },
  D1: {
    title: "Claude Developer Certification",
    sections: {
      P: "Prompting & outputs",
      T: "Tool use & streaming",
      C: "Context & memory",
      A: "Agents & Claude Code",
      M: "MCP & secrets",
      E: "Evals, errors & cost",
      S: "Security",
      D: "Regulated delivery",
    },
  },
};

export function trackConfig(track: string): TrackConfig {
  return TRACKS[track] ?? { title: track, sections: {} };
}
