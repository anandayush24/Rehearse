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
  C0: {
    title: "Build with LLMs (Beginner, hands-on)",
    sections: {
      A: "Calling LLM APIs",
      P: "Prompts & structured output",
      E: "Embeddings & vector search",
      R: "RAG end to end",
      G: "Agents, tools & MCP",
      H: "Production hardening",
      M: "Android & JVM backends",
      F: "Multimodal, local models & fine-tuning",
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
  C2: {
    title: "Inference & Cost",
    sections: {
      I: "Serving",
      Q: "Optimization",
      C: "Cost",
      G: "Decoding",
      P: "Delivery & cost ops",
      D: "On-device",
    },
  },
  C3: {
    title: "Prompting & Structured Output",
    sections: {
      P: "Prompting",
      S: "Structured output",
      R: "Robustness",
      H: "Instruction hierarchy & reasoning",
    },
  },
  C4: {
    title: "RAG",
    sections: {
      R: "Pipeline",
      Q: "Retrieval",
      O: "Operations",
      P: "Document parsing",
      A: "Indexes & vector DBs",
      S: "Security & isolation",
    },
  },
  C5: {
    title: "Agents & Tools",
    sections: {
      A: "Basics",
      P: "Patterns",
      G: "Guardrails",
      T: "Tool design",
      D: "Design choices",
      E: "Evaluation & operations",
    },
  },
  C6: {
    title: "Fine-tuning",
    sections: {
      W: "Strategy",
      P: "Methods",
      D: "Choosing & data",
      T: "Training mechanics",
      E: "Failure modes & evaluation",
    },
  },
  C7: {
    title: "Evals & Safety",
    sections: {
      M: "Evals",
      S: "Safety",
      J: "LLM judges",
      O: "Online evaluation",
    },
  },
  C8: {
    title: "GenAI System Design & LLMOps",
    sections: {
      A: "Architecture",
      L: "LLMOps",
      D: "Design",
      P: "Product architectures",
      V: "Voice & on-device",
      K: "Cost & caching",
      B: "Pipelines",
      R: "Release engineering",
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
