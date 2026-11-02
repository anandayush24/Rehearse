import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

import { schedule, type Grade } from "./srs";
import { STORAGE_KEY } from "./storage-key";
import {
  MAX_REVIEWS,
  STATE_VERSION,
  emptyProgress,
  sanitize,
  type Progress,
  type QuestionState,
  type Settings,
} from "./state";

export { STORAGE_KEY };

/** localStorage can throw (private mode, blocked site data, quota). The app keeps working in memory. */
const safeStorage: StateStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* progress lasts for this visit only */
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

interface Actions {
  toggleDone: (id: string) => void;
  toggleSaved: (id: string) => void;
  setNote: (id: string, note: string) => void;
  review: (id: string, grade: Grade, now?: number) => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  visit: (topicId: string, questionId?: string) => void;
  importProgress: (data: Progress) => void;
  resetProgress: () => void;
}

export type Store = Progress & Actions;

function patchQuestion(
  questions: Progress["questions"],
  id: string,
  patch: Partial<QuestionState>,
): Progress["questions"] {
  return { ...questions, [id]: { ...questions[id], ...patch } };
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      ...emptyProgress(),

      toggleDone: (id) =>
        set((s) => ({ questions: patchQuestion(s.questions, id, { done: !s.questions[id]?.done }) })),

      toggleSaved: (id) =>
        set((s) => ({ questions: patchQuestion(s.questions, id, { saved: !s.questions[id]?.saved }) })),

      setNote: (id, note) =>
        set((s) => ({ questions: patchQuestion(s.questions, id, { note: note || undefined }) })),

      review: (id, grade, now = Date.now()) =>
        set((s) => {
          const srs = schedule(s.questions[id]?.srs, grade, now);
          return {
            questions: patchQuestion(s.questions, id, grade >= 2 ? { srs, done: true } : { srs }),
            reviews: [...s.reviews, { id, grade, at: now }].slice(-MAX_REVIEWS),
            lastQuestion: id,
          };
        }),

      setSetting: (key, value) => set((s) => ({ settings: { ...s.settings, [key]: value } })),

      visit: (topicId, questionId) =>
        set((s) => ({ lastTopic: topicId, lastQuestion: questionId ?? s.lastQuestion })),

      importProgress: (data) => set({ ...sanitize(data) }),

      resetProgress: () => set((s) => ({ ...emptyProgress(), settings: s.settings })),
    }),
    {
      name: STORAGE_KEY,
      version: STATE_VERSION,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s): Progress => ({
        questions: s.questions,
        reviews: s.reviews,
        settings: s.settings,
        lastTopic: s.lastTopic,
        lastQuestion: s.lastQuestion,
      }),
      merge: (persisted, current) => ({ ...current, ...sanitize(persisted) }),
    },
  ),
);

/**
 * Keeps open tabs in sync: when another tab writes progress, reload it here.
 *
 * Saved progress is read synchronously when the store is created in the browser. Hydrating
 * later (from an effect) lets an early write, such as a page recording its last-visited
 * topic, replace the saved data with defaults before it was ever read.
 */
export function syncTabs(): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) void useStore.persist.rehydrate();
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

const subscribeNever = () => () => {};

/**
 * False while rendering on the server and during hydration, true afterwards. Anything that
 * depends on saved progress waits for this so the first client render matches the static HTML.
 */
export const useHydrated = (): boolean =>
  useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
