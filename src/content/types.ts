import { z } from "zod";

/**
 * Shapes shared by the content build (scripts/build-content.ts) and the app.
 * The build validates everything it writes against these schemas, so the app can
 * trust the JSON in public/data without re-checking it.
 */

export const LevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export type Level = z.infer<typeof LevelSchema>;

export const KindSchema = z.enum(["concept", "scenario"]);
export type Kind = z.infer<typeof KindSchema>;

export const QuestionIdSchema = z.string().regex(/^[A-Z]\d+-Q\d+$/);

export const SectionSchema = z.object({
  key: z.string(),
  label: z.string(),
  html: z.string(),
});
export type Section = z.infer<typeof SectionSchema>;

export const QuestionSchema = z.object({
  id: QuestionIdSchema,
  topic: z.string(),
  kind: KindSchema,
  level: LevelSchema,
  subtopic: z.string().min(1),
  scenarioType: z.string().optional(),
  /** Scenario questions only: the situation the candidate is given. */
  contextHtml: z.string().optional(),
  promptHtml: z.string().min(1),
  /** Anchor of the master-notes section that explains this question. */
  notes: z.string().optional(),
  sections: z.array(SectionSchema),
});
export type Question = z.infer<typeof QuestionSchema>;

export const TopicDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  scopeHtml: z.string(),
  /** Master notes: read these first; questions link to a section by id. */
  notes: z.array(z.object({ id: z.string(), title: z.string(), html: z.string() })).optional(),
  questions: z.array(QuestionSchema),
});
export type TopicData = z.infer<typeof TopicDataSchema>;

export const QuestionMetaSchema = z.object({
  id: QuestionIdSchema,
  level: LevelSchema,
  kind: KindSchema,
  subtopic: z.string(),
});
export type QuestionMeta = z.infer<typeof QuestionMetaSchema>;

export const TopicMetaSchema = z.object({
  id: z.string(),
  track: z.string(),
  num: z.string(),
  code: z.string(),
  title: z.string(),
  section: z.string(),
  hasNotes: z.boolean().optional(),
  questions: z.array(QuestionMetaSchema),
});
export type TopicMeta = z.infer<typeof TopicMetaSchema>;

export const ManifestSchema = z.object({
  version: z.literal(1),
  contentHash: z.string(),
  tracks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      sections: z.array(z.object({ name: z.string(), topics: z.array(z.string()) })),
    }),
  ),
  topics: z.array(TopicMetaSchema),
});
export type Manifest = z.infer<typeof ManifestSchema>;

export const SearchDocSchema = z.object({
  id: QuestionIdSchema,
  topic: z.string(),
  title: z.string(),
  text: z.string(),
});
export type SearchDoc = z.infer<typeof SearchDocSchema>;
