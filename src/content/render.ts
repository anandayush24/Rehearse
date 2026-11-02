import rehypeShiki, { type RehypeShikiOptions } from "@shikijs/rehype";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import type { BundledLanguage } from "shiki";
import { unified, type Plugin } from "unified";

/**
 * Markdown → HTML at build time. Code is highlighted with Shiki using CSS variables
 * for both themes, so the browser needs no highlighter and dark mode costs nothing.
 */

interface MdNode {
  type: string;
  value?: string;
  children?: MdNode[];
}

/**
 * The notes contain things like `List<out E>` outside code spans. Markdown reads that as
 * raw HTML and the HTML renderer would drop it, so turn raw HTML back into visible text.
 */
const htmlAsText: Plugin<[], MdNode> = () => (tree) => {
  const walk = (node: MdNode, blockParent: boolean) => {
    if (!node.children) return;
    node.children = node.children.map((child) => {
      if (child.type === "html") {
        const text: MdNode = { type: "text", value: child.value ?? "" };
        return blockParent ? { type: "paragraph", children: [text] } : text;
      }
      const isBlockContainer = ["root", "blockquote", "listItem"].includes(child.type);
      walk(child, isBlockContainer);
      return child;
    });
  };
  walk(tree, true);
};

const LANGS: BundledLanguage[] = ["kotlin", "java", "groovy", "xml", "json", "yaml", "bash", "sql"];

const SHIKI: RehypeShikiOptions = {
  themes: { light: "github-light", dark: "github-dark" },
  defaultColor: false,
  langs: LANGS,
  fallbackLanguage: "text",
  langAlias: { kts: "kotlin", gradle: "groovy", kt: "kotlin" },
};

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(htmlAsText)
  .use(remarkRehype)
  .use(rehypeShiki, SHIKI)
  .use(rehypeStringify);

export async function renderMarkdown(md: string): Promise<string> {
  if (!md.trim()) return "";
  return String(await processor.process(md));
}

/** Plain text for the search index: markup characters removed, code kept (identifiers are searchable). */
export function plainText(md: string): string {
  return md
    .replace(/```[a-z]*\n?/gi, " ")
    .replace(/[`*_#>|~[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
