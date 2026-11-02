import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEY, useStore } from "./store";
import { emptyProgress } from "./state";

const NOW = 1_700_000_000_000;

beforeEach(() => useStore.setState({ ...emptyProgress() }));

describe("store", () => {
  it("toggles done and saved independently", () => {
    useStore.getState().toggleDone("A1-Q001");
    useStore.getState().toggleSaved("A1-Q001");
    expect(useStore.getState().questions["A1-Q001"]).toEqual({ done: true, saved: true });
    useStore.getState().toggleDone("A1-Q001");
    expect(useStore.getState().questions["A1-Q001"]).toEqual({ done: false, saved: true });
  });

  it("clears an emptied note", () => {
    useStore.getState().setNote("A1-Q001", "hello");
    expect(useStore.getState().questions["A1-Q001"].note).toBe("hello");
    useStore.getState().setNote("A1-Q001", "");
    expect(useStore.getState().questions["A1-Q001"].note).toBeUndefined();
  });

  it("a Good review schedules the card, marks it done and logs it", () => {
    useStore.getState().review("A1-Q002", 2, NOW);
    const s = useStore.getState();
    expect(s.questions["A1-Q002"].done).toBe(true);
    expect(s.questions["A1-Q002"].srs?.interval).toBe(1);
    expect(s.reviews).toEqual([{ id: "A1-Q002", grade: 2, at: NOW }]);
    expect(s.lastQuestion).toBe("A1-Q002");
  });

  it("an Again review keeps the question not done", () => {
    useStore.getState().review("A1-Q003", 0, NOW);
    expect(useStore.getState().questions["A1-Q003"].done).toBeUndefined();
  });

  it("reset clears progress but keeps settings", () => {
    useStore.getState().setSetting("theme", "dark");
    useStore.getState().toggleDone("A1-Q001");
    useStore.getState().resetProgress();
    expect(useStore.getState().questions).toEqual({});
    expect(useStore.getState().settings.theme).toBe("dark");
  });

  it("import replaces progress with validated data", () => {
    const p = emptyProgress();
    p.questions["A1-Q009"] = { saved: true };
    useStore.getState().importProgress(p);
    expect(useStore.getState().questions).toEqual({ "A1-Q009": { saved: true } });
  });
});

describe("persistence", () => {
  it("keeps saved progress when something writes before the UI has rendered", async () => {
    // Regression: hydrating from an effect let a page's early visit() overwrite saved data with defaults.
    const saved = emptyProgress();
    saved.questions["A1-Q001"] = { done: true };
    saved.settings.theme = "dark";
    const data = new Map([[STORAGE_KEY, JSON.stringify({ state: saved, version: 1 })]]);
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    });
    vi.resetModules();
    const fresh = await import("./store");

    fresh.useStore.getState().visit("a1-01-k1a");

    expect(fresh.useStore.getState().questions["A1-Q001"]).toEqual({ done: true });
    const written = JSON.parse(data.get(STORAGE_KEY)!).state;
    expect(written.questions["A1-Q001"]).toEqual({ done: true });
    expect(written.settings.theme).toBe("dark");
    vi.unstubAllGlobals();
  });

  it("falls back to defaults when saved data is corrupt", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () => '{"state":{"questions":"nope"},"version":1}',
      setItem: () => {},
      removeItem: () => {},
    });
    vi.resetModules();
    const fresh = await import("./store");
    expect(fresh.useStore.getState().questions).toEqual({});
    expect(fresh.useStore.getState().settings.theme).toBe("system");
    vi.unstubAllGlobals();
  });
});
