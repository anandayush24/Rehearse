/**
 * ```flow blocks → inline SVG with animated packets (SMIL, no client JS, so it works in the static export).
 * Syntax, one chain per line:   Client -> Load balancer -> App -> (Postgres)
 * A node is its text; `(x)` draws a rounded "store". `# caption` lines become the caption.
 * shortcut: layered left-to-right layout only, no cycles drawn; use ASCII for anything fancier.
 */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function flowToSvg(src: string): string {
  const edges: [string, string][] = [];
  const store = new Set<string>();
  const order: string[] = [];
  const caption: string[] = [];
  const seen = (raw: string) => {
    const m = /^\((.*)\)$/.exec(raw.trim());
    const id = (m ? m[1] : raw).trim();
    if (m) store.add(id);
    if (!order.includes(id)) order.push(id);
    return id;
  };
  for (const line of src.split("\n")) {
    if (line.trim().startsWith("#")) caption.push(line.trim().slice(1).trim());
    else if (line.includes("->")) {
      const ids = line.split("->").filter((p) => p.trim()).map(seen);
      for (let i = 0; i + 1 < ids.length; i++) edges.push([ids[i], ids[i + 1]]);
    }
  }
  if (!order.length) return "";

  // Layer = longest path from a source; edges pointing back are ignored so loops cannot hang the build.
  const layer = new Map(order.map((n) => [n, 0]));
  for (let pass = 0; pass < order.length; pass++)
    for (const [a, b] of edges) if (layer.get(b)! < layer.get(a)! + 1 && layer.get(a)! < order.length) layer.set(b, layer.get(a)! + 1);
  const maxL = Math.max(...layer.values());
  const cols: string[][] = Array.from({ length: maxL + 1 }, () => []);
  for (const n of order) cols[Math.min(layer.get(n)!, maxL)].push(n);

  const H = 44, GX = 56, GY = 18, PAD = 12;
  const widths = cols.map((c) => Math.max(90, ...c.map((n) => n.length * 7.2 + 24)));
  const xs: number[] = [];
  widths.reduce((x, w, i) => ((xs[i] = x), x + w + GX), PAD);
  const rows = Math.max(...cols.map((c) => c.length));
  const totalH = rows * (H + GY) - GY + PAD * 2;
  const totalW = xs[maxL] + widths[maxL] + PAD;
  const pos = new Map<string, { x: number; y: number; w: number; l: number }>();
  cols.forEach((c, l) => {
    const top = PAD + ((rows - c.length) * (H + GY)) / 2;
    c.forEach((n, i) => pos.set(n, { x: xs[l], y: top + i * (H + GY), w: widths[l], l }));
  });

  const T = (maxL + 1) * 0.8;
  let out = "";
  edges.forEach(([a, b], i) => {
    const p = pos.get(a)!, q = pos.get(b)!;
    if (q.l <= p.l) return;
    const x1 = p.x + p.w, y1 = p.y + H / 2, x2 = q.x, y2 = q.y + H / 2;
    const d = `M${x1} ${y1} L${x2} ${y2}`;
    const s = (p.l * 0.8) / T, e = ((p.l + 1) * 0.8) / T;
    out += `<path d="${d}" style="stroke:var(--muted);fill:none" stroke-width="1.5" marker-end="url(#fa)"/>`;
    out +=
      `<circle class="flow-dot" r="5" style="fill:var(--accent)" opacity="0">` +
      `<animateMotion dur="${T}s" repeatCount="indefinite" path="${d}" keyPoints="0;0;1;1" keyTimes="0;${s.toFixed(3)};${e.toFixed(3)};1" calcMode="linear"/>` +
      `<animate attributeName="opacity" dur="${T}s" repeatCount="indefinite" values="0;1;1;0;0" keyTimes="0;${s.toFixed(3)};${e.toFixed(3)};${(e + 0.001).toFixed(3)};1"/></circle>`;
    void i;
  });
  for (const [n, p] of pos)
    out +=
      `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${H}" rx="${store.has(n) ? H / 2 : 8}" style="fill:var(--surface);stroke:var(--accent)" stroke-width="1.5"/>` +
      `<text x="${p.x + p.w / 2}" y="${p.y + H / 2 + 4}" text-anchor="middle" font-size="13" style="fill:var(--ink)">${esc(n)}</text>`;

  const cap = caption.length ? `<figcaption>${esc(caption.join(" "))}</figcaption>` : "";
  return (
    `<figure class="flow"><svg viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" role="img" aria-label="${esc(caption.join(" ") || order.join(", "))}">` +
    `<defs><marker id="fa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" style="fill:var(--muted)"/></marker></defs>` +
    `${out}</svg>${cap}</figure>`
  );
}
