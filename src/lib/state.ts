import { z } from "zod";

import { GradeSchema, SrsCardSchema } from "./srs";

/**
 * The reader's progress. Everything lives in this browser, so the shape is versioned,
 * validated on load and on import, and a corrupt blob falls back to defaults instead of
 * crashing the app.
 */

export const STATE_VERSION = 1;
export const MAX_REVIEWS = 5000;

export const ThemeSchema = z.enum(["system", "light", "dark", "sepia"]);
export type Theme = z.infer<typeof ThemeSchema>;

export const SettingsSchema = z.object({
  theme: ThemeSchema,
  fontScale: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  /** Hide answers until the reader reveals them. */
  recall: z.boolean(),
});
export type Settings = z.infer<typeof SettingsSchema>;

export const QuestionStateSchema = z.object({
  done: z.boolean().optional(),
  saved: z.boolean().optional(),
  note: z.string().max(5000).optional(),
  srs: SrsCardSchema.optional(),
});
export type QuestionState = z.infer<typeof QuestionStateSchema>;

export const ReviewSchema = z.object({ id: z.string(), grade: GradeSchema, at: z.number() });
export type Review = z.infer<typeof ReviewSchema>;

export const ProgressSchema = z.object({
  questions: z.record(z.string(), QuestionStateSchema),
  reviews: z.array(ReviewSchema).max(MAX_REVIEWS),
  settings: SettingsSchema,
  lastTopic: z.string().optional(),
  lastQuestion: z.string().optional(),
});
export type Progress = z.infer<typeof ProgressSchema>;

export const DEFAULT_SETTINGS: Settings = { theme: "system", fontScale: 1, recall: false };

export const emptyProgress = (): Progress => ({
  questions: {},
  reviews: [],
  settings: { ...DEFAULT_SETTINGS },
});

/** Accepts anything read from storage; returns valid progress or defaults. */
export function sanitize(input: unknown): Progress {
  const parsed = ProgressSchema.safeParse(input);
  if (parsed.success) return parsed.data;
  // Keep what is salvageable: settings and per-question state often survive a bad review log.
  const partial = z
    .object({ questions: z.record(z.string(), QuestionStateSchema), settings: SettingsSchema })
    .safeParse(input);
  return partial.success ? { ...emptyProgress(), ...partial.data } : emptyProgress();
}

const ExportSchema = z.object({
  app: z.literal("senior-prep"),
  version: z.number(),
  exportedAt: z.string(),
  data: ProgressSchema,
});

export function serializeExport(data: Progress, now = new Date()): string {
  return JSON.stringify(
    { app: "senior-prep", version: STATE_VERSION, exportedAt: now.toISOString(), data },
    null,
    2,
  );
}

/** Throws a readable Error when the file is not a valid export. */
export function parseExport(text: string): Progress {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("That file is not valid JSON.");
  }
  const parsed = ExportSchema.safeParse(json);
  if (!parsed.success) throw new Error("That file is not a Rehearse export.");
  if (parsed.data.version > STATE_VERSION) {
    throw new Error("That export comes from a newer version of the app. Update and try again.");
  }
  return parsed.data.data;
}
