import { readFileSync } from "node:fs";
import path from "node:path";

import { ManifestSchema, TopicDataSchema, type Manifest, type TopicData } from "@/content/types";

/**
 * Build-time data access for server components. Reads the JSON that `npm run content`
 * writes to public/data; the same files are what the browser fetches at runtime.
 */

const dataDir = path.join(process.cwd(), "public", "data");

let manifest: Manifest | undefined;
const topics = new Map<string, TopicData>();

export function getManifest(): Manifest {
  manifest ??= ManifestSchema.parse(JSON.parse(readFileSync(path.join(dataDir, "manifest.json"), "utf8")));
  return manifest;
}

export function getTopic(id: string): TopicData {
  let topic = topics.get(id);
  if (!topic) {
    topic = TopicDataSchema.parse(
      JSON.parse(readFileSync(path.join(dataDir, "topics", `${id}.json`), "utf8")),
    );
    topics.set(id, topic);
  }
  return topic;
}
