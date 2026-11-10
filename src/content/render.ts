import rehypeShiki, { type RehypeShikiOptions } from "@shikijs/rehype";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import type { BundledLanguage } from "shiki";
import { unified, type Plugin } from "unified";
import { flowToSvg } from "./flow";

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

const LANGS: BundledLanguage[] = ["kotlin", "java", "groovy", "xml", "json", "yaml", "bash", "sql", "python", "cpp"];

const SHIKI: RehypeShikiOptions = {
  themes: { light: "github-light", dark: "github-dark" },
  defaultColor: false,
  langs: LANGS,
  fallbackLanguage: "text",
  langAlias: { kts: "kotlin", gradle: "groovy", kt: "kotlin", "c++": "cpp", py: "python" },
};

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(htmlAsText)
  .use(remarkRehype)
  .use(rehypeShiki, SHIKI)
  .use(rehypeStringify);

const TAB_LABEL: Record<string, string> = { cpp: "C++", "c++": "C++", java: "Java", kotlin: "Kotlin", kt: "Kotlin", python: "Python", py: "Python" };
let tabGroupId = 0;

/** A run of fences marked `tab` (```cpp tab, ```java tab, ...) becomes ONE tabbed block, pure CSS so it works in the static export. */
async function tabGroup(fences: { lang: string; code: string }[]): Promise<string> {
  const id = `ct${tabGroupId++}`;
  const labels = fences.map((f) => TAB_LABEL[f.lang] ?? f.lang);
  const panels = await Promise.all(fences.map((f) => processor.process("```" + f.lang + "\n" + f.code + "```")));
  const inputs = fences.map((_, i) => `<input type="radio" name="${id}" id="${id}-${i}"${i === 0 ? " checked" : ""} aria-label="${labels[i]}">`).join("");
  const labelEls = labels.map((l, i) => `<label for="${id}-${i}">${l}</label>`).join("");
  return `<div class="codetabs">${inputs}<div class="ct-head"><span class="ct-title">Languages: ${labels.join(" · ")}</span><span class="ct-labels">${labelEls}</span></div><div class="ct-panels">${panels.map((p) => `<div>${String(p)}</div>`).join("")}</div></div>`;
}

const FENCE = "^" + "`".repeat(3) + String.raw`(\w+\+*)[^\S
]+tab[^\S
]*
([\s\S]*?)^` + "`".repeat(3) + String.raw`[^\S
]*$`;

export async function renderMarkdown(md: string): Promise<string> {
  if (!md.trim()) return "";
  // ```flow blocks are swapped for a placeholder paragraph, then for inline SVG after rendering.
  const flows: string[] = [];
  const groups: { lang: string; code: string }[][] = [];
  let body = md.replace(/^```flow[^\S\n]*\n([\s\S]*?)^```[^\S\n]*$/gm, (_, src: string) => {
    flows.push(flowToSvg(src));
    return `FLOWSVG${flows.length - 1}X`;
  });
  body = body.replace(new RegExp(String.raw`(?:${FENCE}\n*)+`, "gm"), (run) => {
    groups.push([...run.matchAll(new RegExp(FENCE, "gm"))].map((m) => ({ lang: m[1], code: m[2] })));
    return `\nTABSGRP${groups.length - 1}X\n\n`;
  });
  let html = String(await processor.process(body));
  html = html.replace(/<p>FLOWSVG(\d+)X<\/p>/g, (_, i: string) => flows[+i]);
  for (let i = 0; i < groups.length; i++) {
    html = html.replace(`<p>TABSGRP${i}X</p>`, await tabGroup(groups[i]));
  }
  return html;
}

/** Plain text for the search index: markup characters removed, code kept (identifiers are searchable). */
export function plainText(md: string): string {
  return md
    .replace(/```[a-z]*\n?/gi, " ")
    .replace(/[`*_#>|~[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
