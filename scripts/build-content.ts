/**
 * Builds public/data from the Markdown note chunks.
 *
 *   npm run content                       # reads ../<TRACK>/chunks
 *   CONTENT_ROOT=tests/fixtures npm run content
 */
import path from "node:path";

import { buildContent, writeContent } from "../src/content/build";

const root = path.resolve(__dirname, "..");
const contentRoot = path.resolve(root, process.env.CONTENT_ROOT ?? "..");
const outDir = path.join(root, "public", "data");

async function main() {
  const started = Date.now();
  const result = await buildContent(contentRoot);
  await writeContent(result, outDir);
  const questions = result.manifest.topics.reduce((n, t) => n + t.questions.length, 0);
  console.log(
    `content: ${result.manifest.topics.length} topics, ${questions} questions ` +
      `(hash ${result.manifest.contentHash}) in ${((Date.now() - started) / 1000).toFixed(1)}s -> ${outDir}`,
  );
}

main().catch((err) => {
  console.error(`content build failed: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
