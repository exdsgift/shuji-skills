// Render a bento diagram's .drawio file: finish its model, check every page, and write previews of both themes.
//
//   node render.mjs picture.drawio [--out DIR] [--zoom cellId|words,...] [--scale 2]
//
// The .drawio is the deliverable, so whatever must hold in the draw.io editor is fixed in the model itself, in place:
// every arrow label gets a background sized to its measured words (draw.io sizes it from a fallback font and leaves
// the line touching the letters), and every shadow becomes the soft one (draw.io's default is a hard offset that
// glows in the dark theme). Then each page is exported as draw.io draws it, checked with the text as a browser lays it
// out, and previewed, in a temporary folder unless --out names one. Needs Node 18+, the draw.io desktop app and Chrome
// or Edge; set DRAWIO or CHROME when either is somewhere unusual. The fonts come from ../assets/fonts (Instrument Sans
// and IBM Plex Mono, OFL-1.1). Exits 1 while a check finds a problem or cannot run: a picture is done when it prints
// "overlap check: clean" for every page.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const fontsDir = path.join(here, "..", "assets", "fonts");
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
// the first path that exists, else the last entry, a bare name looked up on PATH
const locate = (env, list) => process.env[env] || list.find((p) => fs.existsSync(p)) || list.at(-1);
const DRAWIO = locate("DRAWIO", [
  path.join(process.env.LOCALAPPDATA || "", "Programs/draw.io/draw.io.exe"),
  "C:/Program Files/draw.io/draw.io.exe",
  "/Applications/draw.io.app/Contents/MacOS/draw.io",
  "drawio",
]);
const CHROME = locate("CHROME", [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "google-chrome",
]);

// The style rules the check enforces (SKILL.md, "No AI watermark, no AI slop").
const CREDIT = String.raw`\b(generated|made|created|designed|drawn|rendered|built|produced|powered)\s+(by|with|using|in|via)\s+(an?\s+)?(ai|llm|claude|chatgpt|gpt[\w.-]*|gemini|copilot|midjourney|draw\.?io|bento[- ]diagrams|anthropic|openai)\b|\bai[- ]generated\b`;
const SLOP = String.raw`\b(seamless(ly)?|cutting[- ]edge|game[- ]chang\w*|next[- ]gen(eration)?|revolutionary|supercharge\w*|unleash\w*|empower\w*|synerg\w*|best[- ]in[- ]class|world[- ]class|state[- ]of[- ]the[- ]art|delightful)\b|\p{Emoji_Presentation}`;
// draw.io draws this as one black layer, 4 px down with a 10 px blur: soft on the white page, all but gone on black
const SOFT_SHADOW = "shadowColor=light-dark(#000000,#000000);shadowOpacity=8;shadowOffsetX=0;shadowOffsetY=4;shadowBlur=10;";

const args = process.argv.slice(2);
const option = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
const input = args.find((a, i) => !a.startsWith("--") && !["--out", "--zoom", "--scale"].includes(args[i - 1]));
const scale = Number(option("--scale")) || 2;
const zoom = (option("--zoom") || "").split(",").map((s) => s.trim()).filter(Boolean);
if (!input || !input.endsWith(".drawio") || !fs.existsSync(input)) {
  console.error("usage: node render.mjs picture.drawio [--out DIR] [--zoom cellId|words,...] [--scale 2]");
  process.exit(2);
}
const name = path.basename(input, ".drawio");
// one folder per file, so two pictures with the same name rendered at once never share previews
const key = crypto.createHash("sha1").update(path.resolve(input)).digest("hex").slice(0, 8);
const outDir = path.resolve(option("--out") || path.join(os.tmpdir(), "bento-preview", `${name}-${key}`));
fs.mkdirSync(outDir, { recursive: true });

const chrome = (argv) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "bento-"));
  try {
    return execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--user-data-dir=${path.join(tmp, "p")}`,
      ...argv(tmp)], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 256 << 20 });
  } catch { return ""; } finally { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {} }
};
// run a function in a page and read back what it returns, as JSON in the dumped DOM
const inBrowser = (head, body, fn, ...fnArgs) => {
  // a browser started while several others run can exit with nothing: try three times
  for (let n = 0; n < 3; n++) {
    const dom = chrome((tmp) => {
      const page = path.join(tmp, "page.html");
      fs.writeFileSync(page, `<!doctype html><meta charset="utf-8">${head}<body>${body}<pre id="out"></pre><script>
(${fn})(...${JSON.stringify(fnArgs).replace(/</g, "\\u003c")}).then((r) => { document.getElementById("out").textContent =
  "@@" + btoa(unescape(encodeURIComponent(JSON.stringify(r)))) + "@@"; });
</script>`);
      return ["--virtual-time-budget=10000", "--dump-dom", pathToFileURL(page).href];
    });
    const found = dom.match(/@@([^@]+)@@/);
    if (found) return JSON.parse(Buffer.from(found[1], "base64").toString("utf8"));
  }
  return null;
};
const fontFaces = (families) => families.map(([family, stem]) => [400, 600].map((w) =>
  `@font-face{font-family:"${family}";font-weight:${w};src:url(data:font/woff2;base64,`
  + `${fs.readFileSync(path.join(fontsDir, `${stem}-${w}.woff2`)).toString("base64")}) format("woff2");}`).join("")).join("");

// A tag scanner that respects quotes: an attribute value may hold a raw ">", which breaks a pattern like <tag[^>]*>.
function* tags(xml, tag) {
  for (let i = xml.indexOf("<" + tag); i >= 0; i = xml.indexOf("<" + tag, i + 1)) {
    if (!/[\s/>]/.test(xml[i + tag.length + 1] || "")) continue;
    let j = i + 1, q = null;
    for (; j < xml.length; j++) {
      const c = xml[j];
      if (q) { if (c === q) q = null; } else if (c === '"' || c === "'") q = c; else if (c === ">") break;
    }
    yield { start: i, end: j + 1, text: xml.slice(i, j + 1) };
  }
}
const attrsOf = (tagText) => Object.fromEntries([...tagText.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, k, v]) => [k, v]));
const unescapeXml = (s) => s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const styleValue = (style, k) => { let v; for (const m of style.matchAll(new RegExp(`(?:^|;)${k}=([^;]*)`, "g"))) v = m[1]; return v; };
const withStyle = (style, k, v) => new RegExp(`(^|;)${k}=[^;]*`).test(style)
  ? style.replace(new RegExp(`(^|;)${k}=[^;]*`, "g"), (_, p) => `${p}${k}=${v}`)
  : `${style}${style && !style.endsWith(";") ? ";" : ""}${k}=${v};`;
const setAttr = (tagText, k, v) => new RegExp(`\\s${k}="[^"]*"`).test(tagText)
  ? tagText.replace(new RegExp(`(\\s${k}=)"[^"]*"`), (_, p) => `${p}"${v}"`)
  : tagText.replace(/^<([\w:]+)/, (m) => `${m} ${k}="${v}"`);

// 1. Read the pages, uncompressed.
let file = fs.readFileSync(input, "utf8");
const pages = [...file.matchAll(/<diagram\b([^>]*)>([\s\S]*?)<\/diagram>/g)].map((m) => {
  const packed = !m[2].trim().startsWith("<");
  const inner = packed ? decodeURIComponent(zlib.inflateRawSync(Buffer.from(m[2].trim(), "base64")).toString("latin1")) : m[2];
  return { head: m[1], title: unescapeXml(attrsOf(`<d${m[1]}>`).name || ""), inner, packed, start: m.index, end: m.index + m[0].length };
});
if (!pages.length) { console.error(`${input}: no <diagram> page in it`); process.exit(2); }
const cellsOf = (xml) => [...tags(xml, "mxCell")].map((t) => ({ ...t, a: attrsOf(t.text) }));
// every vertex's box in page coordinates, from one pass over the cells and their geometries; a child's geometry is
// relative to its parent vertex
const geometries = (xml) => {
  const cells = cellsOf(xml), rel = {}, abs = {};
  let i = 0;
  for (const g of tags(xml, "mxGeometry")) {
    while (i + 1 < cells.length && cells[i + 1].start < g.start) i++;
    const c = cells[i];
    if (!c || c.start > g.start || c.text.endsWith("/>") || c.a.vertex !== "1" || rel[c.a.id]) continue;
    const a = attrsOf(g.text);
    rel[c.a.id] = { x: Number(a.x) || 0, y: Number(a.y) || 0, w: Number(a.width) || 0, h: Number(a.height) || 0, parent: c.a.parent };
  }
  const at = (id, depth = 0) => {
    if (abs[id] || !rel[id]) return abs[id];
    const r = rel[id], up = depth < 50 && at(r.parent, depth + 1);
    return (abs[id] = { x: r.x + (up ? up.x : 0), y: r.y + (up ? up.y : 0), w: r.w, h: r.h });
  };
  Object.keys(rel).forEach((id) => at(id));
  return abs;
};

// 2. Lint the model: the two slips that cost most, and a credit hidden where no text cell shows it.
const problems = [];
const all = pages.map((p) => p.inner).join("");
if (/(^|[;"])html=1/.test(all)) console.warn("warning: html=1 found; an HTML label exports as a foreignObject");
const hex = all.match(/\b\w*Color=#[0-9A-Fa-f]{3,8}\b/g);
if (hex) console.warn(`warning: ${hex.length} colours with no light-dark() pair, such as ${hex[0]}`);
const credit = new RegExp(CREDIT, "i");
const hidden = [["the file name", name.replace(/[-_]+/g, " ")], ...pages.map((p, i) => [`the name of page ${i + 1}`, p.title]),
  ...[...all.matchAll(/\s(tooltip|link)="([^"]*)"/g)].map((m) => [`a ${m[1]}`, unescapeXml(m[2])])];
for (const [where, words] of hidden) if (credit.test(words)) problems.push(`${where} ("${words.slice(0, 40)}") reads as a credit or a watermark: remove it`);

// 3. Finish the model in place: label backgrounds sized to their words, soft shadows.
const labels = [];
let shadows = 0, sized = 0;
for (const p of pages) {
  p.edits = [];
  for (const c of cellsOf(p.inner)) {
    const style = c.a.style || "";
    if (c.a.vertex === "1" && /(^|;)shadow=1/.test(style) && !/(^|;)shadowColor=/.test(style)) {
      p.edits.push({ start: c.start, end: c.end, text: setAttr(c.text, "style", style + (style && !style.endsWith(";") ? ";" : "") + SOFT_SHADOW) });
      shadows++;
    }
    const words = unescapeXml(c.a.value || "").trim();
    if (c.a.edge === "1" && words && (styleValue(style, "labelBackgroundColor") || "none") !== "none") {
      const size = Number(styleValue(style, "fontSize")) || 11;
      labels.push({ p, c, style, lines: words.split("\n"), size,
        font: `${(Number(styleValue(style, "fontStyle")) & 1) ? 600 : 400} ${size}px ${/Mono/i.test(styleValue(style, "fontFamily") || "") ? "M" : "S"}` });
    }
  }
}
if (labels.length) {
  const widths = inBrowser(`<style>${fontFaces([["S", "instrument-sans"], ["M", "ibm-plex-mono"]])}</style>`, "",
    async (sets) => {
      const c = document.createElement("canvas").getContext("2d");
      const out = [];
      for (const [font, lines] of sets) {
        await document.fonts.load(font);
        c.font = font;
        out.push(Math.max(...lines.map((l) => c.measureText(l).width)));
      }
      return out;
    }, labels.map((l) => [l.font, l.lines]));
  if (!widths) problems.push("the arrow labels could not be measured (no output from the browser)");
  else labels.forEach((l, i) => {
    // draw.io draws a filled label's background at the geometry's size, plus 1 px a side, with the words centred
    const w = Math.ceil(widths[i]) + 16, h = l.size + 2 + (l.lines.length - 1) * Math.ceil(l.size * 1.2);
    const geo = l.c.text.endsWith("/>") ? null : tags(l.p.inner.slice(l.c.end), "mxGeometry").next().value;
    if (!geo) return;
    const ga = attrsOf(geo.text);
    if (styleValue(l.style, "overflow") === "fill" && Number(ga.width) === w && Number(ga.height) === h) return;
    l.p.edits.push({ start: l.c.start, end: l.c.end, text: setAttr(l.c.text, "style", withStyle(l.style, "overflow", "fill")) });
    l.p.edits.push({ start: l.c.end + geo.start, end: l.c.end + geo.end, text: setAttr(setAttr(geo.text, "width", w), "height", h) });
    sized++;
  });
}
// A logo on a tinted tile must stay visible in both themes. Its colours are measured against the tile as each theme
// draws it (the brand tint over the white or the dark card). When every colour falls under 3:1 on the dark tile, the
// contrast a graphic needs, the tile becomes a light chip in the dark theme; under 2:1 on the light tile, a dark chip
// in the light theme (a saturated red at 2.9:1 on its pale tint still reads by its hue; a yellow at 1.4:1 does not).
// A mark with most but not all of its colours under those is left alone and named, so the eye decides.
const rgb = (c) => {
  const named = { black: "#000000", white: "#FFFFFF" }[String(c).toLowerCase()];
  const m = (named || c).match(/^#([0-9a-f]{6}|[0-9a-f]{3})\b/i) || [];
  if (m[1]) return (m[1].length === 3 ? [...m[1]].map((h) => h + h) : m[1].match(/../g)).map((h) => parseInt(h, 16));
  const r = String(c).match(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
  return r ? r.slice(1, 4).map(Number) : null;
};
const luminance = (c) => c.map((v) => v / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const mix = (base, top, k) => base.map((v, i) => Math.round(v + k * (top[i] - v)));
const hexOf = (c) => "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
const pairOf = (v) => { const m = (v || "").match(/light-dark\(([^,]+),([^)]+)\)/); return m ? [rgb(m[1].trim()), rgb(m[2].trim())] : [rgb(v || ""), rgb(v || "")]; };
const markColours = (style) => {
  const data = (style.match(/image=data:image\/svg\+xml,([^;]+)/) || [])[1];
  if (!data) return /shape=mxgraph\./.test(style) ? [pairOf(styleValue(style, "fillColor"))[1]].filter(Boolean) : [];
  const svg = /^(<|%3C)/i.test(data) ? decodeURIComponent(data) : Buffer.from(data, "base64").toString("utf8");
  const found = [...svg.matchAll(/(?:fill|stroke|stop-color)\s*[=:]\s*["']?\s*(#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|black|white)/gi)].map((m) => rgb(m[1]));
  // a shape with no fill of its own is drawn black when nothing above it sets one
  if (!/<svg[^>]*\sfill=/i.test(svg) && /<(path|circle|rect|polygon|ellipse)\b(?![^>]*\sfill=)[^>]*>/i.test(svg)) found.push([0, 0, 0]);
  return found.filter(Boolean);
};
let chips = 0;
const pale = [];
for (const p of pages) {
  const geo = geometries(p.inner), cells = cellsOf(p.inner).filter((c) => c.a.vertex === "1" && geo[c.a.id]);
  for (const mark of cells) {
    const style = unescapeXml(mark.a.style || "");
    if (!/shape=image|shape=mxgraph\.gcp2\.kubernetes_logo/.test(style)) continue;
    const colours = markColours(style), g = geo[mark.a.id];
    if (!colours.length) continue;
    // the tile is the smallest tinted cell under the mark, no bigger than a tile
    const tile = cells.filter((c) => c !== mark && geo[c.a.id].w <= 48 && geo[c.a.id].h <= 48 && /(^|;)fillOpacity=/.test(c.a.style || "")
      && geo[c.a.id].x <= g.x + 1 && geo[c.a.id].y <= g.y + 1 && geo[c.a.id].x + geo[c.a.id].w >= g.x + g.w - 1 && geo[c.a.id].y + geo[c.a.id].h >= g.y + g.h - 1)
      .sort((a, b) => geo[a.a.id].w * geo[a.a.id].h - geo[b.a.id].w * geo[b.a.id].h)[0];
    if (!tile || p.edits.some((e) => e.start === tile.start)) continue;
    const ts = tile.a.style, k = (Number(styleValue(ts, "fillOpacity")) || 100) / 100, [L, D] = pairOf(styleValue(ts, "fillColor"));
    if (!L || !D || k >= 1) continue;
    const onLight = mix([255, 255, 255], L, k), onDark = mix([44, 44, 46], D, k);
    const dim = (bg, min) => colours.filter((c) => contrast(c, bg) < min).length;
    let fill = null;
    if (dim(onDark, 3) === colours.length) fill = `light-dark(${hexOf(onLight)},#D1D1D6)`;
    else if (dim(onLight, 2) === colours.length) fill = `light-dark(#2C2C2E,${hexOf(onDark)})`;
    // one pale colour among several (Google Cloud's yellow) still reads; most of the mark fading does not
    else if (2 * dim(onDark, 3) > colours.length || 2 * dim(onLight, 2) > colours.length) pale.push(mark.a.id);
    if (!fill) continue;
    p.edits.push({ start: tile.start, end: tile.end, text: setAttr(tile.text, "style", withStyle(ts, "fillColor", fill).replace(/(^|;)fillOpacity=[^;]*/, "")) });
    chips++;
  }
}
if (pale.length) console.warn(`warning: part of the logo in ${pale.join(", ")} fades on its tile in one theme; look at it with --zoom ${pale.join(",")}`);
if (pages.some((p) => p.edits.length)) {
  for (const p of pages) for (const e of p.edits.sort((a, b) => b.start - a.start)) p.inner = p.inner.slice(0, e.start) + e.text + p.inner.slice(e.end);
  // a compressed page is written back uncompressed, which draw.io reads the same
  for (const p of [...pages].reverse()) if (p.edits.length) file = file.slice(0, p.start) + `<diagram${p.head}>${p.inner}</diagram>` + file.slice(p.end);
  fs.writeFileSync(input, file);
  console.log(`model: ${sized} label backgrounds sized, ${shadows} shadows softened, ${chips} logo tiles made chips, ${input} updated`);
}

// 4. The check, run in the page with the picture inlined as draw.io exported it.
async function checkPage(meta, zoom, rules) {
  try {
    await document.fonts.ready;
    const svg = document.querySelector("svg");
    // boxes and points in the picture's own coordinates, through any transform (draw.io rotates a vertical line cell)
    const toSvg = (el) => svg.getScreenCTM().inverse().multiply(el.getScreenCTM());
    const box = (el) => {
      const b = el.getBBox(), m = toSvg(el);
      const ps = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(m));
      const x = Math.min(...ps.map((p) => p.x)), y = Math.min(...ps.map((p) => p.y));
      return { x, y, w: Math.max(...ps.map((p) => p.x)) - x, h: Math.max(...ps.map((p) => p.y)) - y };
    };
    const union = (bs) => { const x = Math.min(...bs.map((b) => b.x)), y = Math.min(...bs.map((b) => b.y));
      return { x, y, w: Math.max(...bs.map((b) => b.x + b.w)) - x, h: Math.max(...bs.map((b) => b.y + b.h)) - y }; };
    const grow = (b, d) => ({ x: b.x - d, y: b.y - d, w: b.w + 2 * d, h: b.h + 2 * d });
    const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    const inside = (a, b) => a.x >= b.x && a.y >= b.y && a.x + a.w <= b.x + b.w && a.y + a.h <= b.y + b.h;
    // an edge path as a polyline: the end point of each command, so a rounded corner becomes a short chord
    const polyline = (p) => {
      const m = toSvg(p), pts = [];
      for (const [, , nums] of (p.getAttribute("d") || "").matchAll(/([MLQCA])([^MLQCAZ]*)/g)) {
        const n = nums.trim().split(/[\s,]+/).filter(Boolean).map(Number);
        if (n.length >= 2) pts.push(new DOMPoint(n[n.length - 2], n[n.length - 1]).matrixTransform(m));
      }
      return pts;
    };
    // where the model's coordinates land in the picture: the shift most cells with a drawn box agree on
    const shifts = {};
    for (const g of svg.querySelectorAll("g[data-cell-id]")) {
      const m = meta[g.dataset.cellId], el = g.querySelector("rect");
      if (!m || !m.geo || !el) continue;
      const b = box(el);
      if (Math.abs(b.w - m.geo.w) < 0.5 && Math.abs(b.h - m.geo.h) < 0.5) {
        const k = Math.round(b.x - m.geo.x) + "," + Math.round(b.y - m.geo.y);
        shifts[k] = (shifts[k] || 0) + 1;
      }
    }
    const shift = Object.entries(shifts).sort((a, b) => b[1] - a[1])[0];
    const [dx, dy] = shift ? shift[0].split(",").map(Number) : [];
    const texts = [], shapes = [], edges = [], marks = [];
    for (const g of svg.querySelectorAll("g[data-cell-id]")) {
      const id = g.dataset.cellId, m = meta[id];
      if (!m) continue;
      const ts = [...g.querySelectorAll("text")].filter((t) => t.closest("g[data-cell-id]") === g && t.textContent.trim());
      if (ts.length) {
        // a text cell with pointerEvents=0 draws no box: measure it against the model's geometry instead
        const own = g.querySelector("rect, path, ellipse");
        const cell = m.edge ? null : own ? box(own) : m.geo && shift ? { x: m.geo.x + dx, y: m.geo.y + dy, w: m.geo.w, h: m.geo.h } : null;
        texts.push({ id, m, b: union(ts.map(box)), lines: ts.map(box), words: ts.map((t) => t.textContent.trim()).join(" "), cell });
      }
      if (/shape=image/.test(m.style)) marks.push(box(g));
      const guide = /(^|;)bento=guide/.test(m.style);
      if (m.edge) {
        const pts = [], lines = [];
        for (const p of g.querySelectorAll("path")) {
          if ((p.getAttribute("fill") || "none") !== "none") continue;
          const L = p.getTotalLength(), mt = toSvg(p);
          for (let s = 0; s <= L; s += 2) pts.push(p.getPointAtLength(s).matrixTransform(mt));
          lines.push(polyline(p));
        }
        edges.push({ id, m, pts, lines, guide, bridged: /(^|;)jumpStyle=(?!none)/.test(m.style) });
      } else if (!/(^|;)text;|shape=image/.test(m.style)) {
        const el = g.querySelector("rect, path, ellipse");
        if (!el) continue;
        const b = box(el);
        // a hairline, a gridline or a line cell is a line, not a box: text must not touch it, cards may meet it
        if (/(^|;)line;/.test(m.style) || Math.min(b.w, b.h) <= 3) {
          const pts = [], n = Math.max(1, Math.ceil(Math.max(b.w, b.h) / 2));
          for (let i = 0; i <= n; i++) pts.push(b.w >= b.h ? { x: b.x + (b.w * i) / n, y: b.y + b.h / 2 } : { x: b.x + b.w / 2, y: b.y + (b.h * i) / n });
          edges.push({ id, m, pts, lines: [], guide: true, bridged: true });
        } else shapes.push({ id, m, b, diamond: /rhombus/.test(m.style),
          seen: (el.getAttribute("fill") || "") !== "none" || (el.getAttribute("stroke") || "none") !== "none" });
      }
    }
    const vb = svg.viewBox.baseVal, area = vb.width * vb.height;
    const ends = new Set(edges.flatMap((e) => [e.m.source, e.m.target]).filter(Boolean));
    for (const s of shapes) s.holds = s.b.w * s.b.h > 0.6 * area || shapes.some((o) => o !== s && ends.has(o.id) && inside(o.b, s.b));
    const quote = (t) => '"' + t.words.slice(0, 40) + '"';
    const name = (id) => {
      const s = shapes.find((s) => s.id === id);
      if (!s) { const own = texts.find((t) => t.id === id); return own ? quote(own) : id; }
      if (s.b.w * s.b.h > 0.6 * area) return "the page background";
      const t = texts.find((t) => t.id === id) || texts.find((t) => inside(t.b, s.b) && !t.m.edge);
      return t ? "the box of " + quote(t) : "the box " + id;
    };
    const inShape = (p, s, d) => s.diamond
      ? Math.abs(p.x - s.b.x - s.b.w / 2) / (s.b.w / 2 - d) + Math.abs(p.y - s.b.y - s.b.h / 2) / (s.b.h / 2 - d) < 1
      : p.x > s.b.x + d && p.x < s.b.x + s.b.w - d && p.y > s.b.y + d && p.y < s.b.y + s.b.h - d;
    const out = [];

    // the words: no credit, no slop, no step numbers
    const credit = new RegExp(rules.credit, "i"), slop = new RegExp(rules.slop, "iu");
    for (const t of texts) {
      const w = t.words, mono = /Mono/.test(t.m.style);
      if (credit.test(w)) out.push(quote(t) + " reads as a credit or a watermark: remove it");
      // an exclamation mark is slop in words, and an operator in code
      if (slop.test(w) || (!mono && /!(?!=)/.test(w))) out.push(quote(t) + " reads as AI slop (a buzzword, an exclamation mark or an emoji): say the plain fact");
      // a number alone in a small cell is a step number, whatever shape carries it
      if (/^\d{1,3}$/.test(w) && t.cell && t.cell.w <= 36 && t.cell.h <= 36) out.push(quote(t) + " is a numbered card: cards carry no numbers, remove it");
      // "(1, 2)" anywhere, or "(4)" in a sentence, points at step numbers; "workers (4)" on a card does not
      if (/(^|\s)\(\d{1,3}(\s*([,–-]|and)\s*\d{1,3})+\)/.test(w) || (w.length > 60 && /(^|\s)\(\d{1,3}\)/.test(w)))
        out.push(quote(t) + " refers to step numbers: tell the order in words");
    }
    // the layout: nothing touches, nothing crosses
    texts.forEach((a, i) => texts.slice(i + 1).forEach((b) => {
      if (hit(grow(a.b, -1), grow(b.b, -1))) out.push(quote(a) + " overlaps " + quote(b));
    }));
    shapes.forEach((a, i) => shapes.slice(i + 1).forEach((b) => {
      if (hit(grow(a.b, -1), grow(b.b, -1)) && !inside(a.b, grow(b.b, 1)) && !inside(b.b, grow(a.b, 1)))
        out.push(name(a.id) + " overlaps " + name(b.id));
    }));
    for (const e of edges) for (const t of texts) {
      // a label with a background masks its own line, and any line that shares that stretch of it
      const owner = edges.find((o) => o.id === t.id), T = grow(t.b, 1.5);
      const masked = owner && /labelBackgroundColor=(?!none)/.test(owner.m.style);
      const near = (p) => owner.pts.some((q) => Math.abs(p.x - q.x) + Math.abs(p.y - q.y) < 2);
      const through = e.pts.filter((p) => p.x > T.x && p.x < T.x + T.w && p.y > T.y && p.y < T.y + T.h);
      if (through.length && !(masked && (e === owner || through.every(near)))) out.push("a line (" + e.id + ") runs through " + quote(t));
    }
    for (const e of edges) for (const s of shapes) {
      if (e.guide || s.holds || s.id === e.m.source || s.id === e.m.target || s.b.w * s.b.h < 600) continue;
      if (e.pts.some((p) => inShape(p, s, 3))) out.push("a line (" + e.id + ") crosses " + name(s.id));
    }
    // two arrows that cross without a bridge; a merge, a fork or a shared stretch only touches, so it passes
    const turn = (p, q, r) => { const v = (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x); return Math.abs(v) < 0.5 ? 0 : Math.sign(v); };
    const crosses = (a, b, c, d) => turn(a, b, c) * turn(a, b, d) < 0 && turn(c, d, a) * turn(c, d, b) < 0;
    const segs = (e) => e.lines.flatMap((l) => l.slice(1).map((p, i) => [l[i], p]));
    edges.forEach((a, i) => edges.slice(i + 1).forEach((b) => {
      if (a.guide || b.guide || a.bridged || b.bridged) return;
      const sb = segs(b);
      if (segs(a).some(([p, q]) => sb.some(([r, s]) => crosses(p, q, r, s))))
        out.push("lines " + a.id + " and " + b.id + " cross: reroute one, or bridge it with jumpStyle=arc;jumpSize=10;");
    }));
    for (const t of texts) for (const s of shapes) {
      const T = grow(t.b, -1);
      if (s.id !== t.id && hit(T, s.b) && !inside(T, s.b)) out.push(quote(t) + " crosses the edge of " + name(s.id));
    }
    for (const t of texts) if (t.cell) {
      const over = Math.max(t.cell.x - t.b.x, t.b.x + t.b.w - t.cell.x - t.cell.w);
      if (over > 2) out.push(quote(t) + " is wider than its box by " + Math.ceil(over) + " px");
      const under = Math.max(t.cell.y - t.b.y, t.b.y + t.b.h - t.cell.y - t.cell.h);
      if (under > 3) out.push(quote(t) + " is taller than its box by " + Math.ceil(under) + " px");
    }
    // a diamond's words must clear its slanted sides, not only its bounding box; a line's box is trimmed to the
    // letters, since a text box includes the space above and below them
    for (const s of shapes) if (s.diamond) for (const t of texts) {
      if (t.id !== s.id && !inside(t.b, s.b)) continue;
      const cx = s.b.x + s.b.w / 2, cy = s.b.y + s.b.h / 2, rx = s.b.w / 2 - 1, ry = s.b.h / 2 - 1;
      const past = t.lines.some((l) => [l.x, l.x + l.w].some((x) => [l.y + l.h * 0.15, l.y + l.h * 0.85]
        .some((y) => Math.abs(x - cx) / rx + Math.abs(y - cy) / ry > 1)));
      if (past) out.push(quote(t) + " runs past the slanted sides of its diamond: shorten the lines or split them (about 10 characters a line in 120 x 80)");
    }
    // near misses read as crowding: words 6 px apart on one row (a legend keeps 8 between cells, about 7 between the
    // letters), a line 12 px from words it neither carries nor enters
    texts.forEach((a, i) => texts.slice(i + 1).forEach((b) => {
      const row = Math.min(a.b.y + a.b.h, b.b.y + b.b.h) - Math.max(a.b.y, b.b.y);
      const gap = Math.max(b.b.x - a.b.x - a.b.w, a.b.x - b.b.x - b.b.w);
      if (row > 0.5 * Math.min(a.b.h, b.b.h) && gap >= 0 && gap < 6)
        out.push(quote(a) + " and " + quote(b) + " are " + Math.round(gap) + " px apart: keep 6 px between words on a row");
    }));
    const dist = (p, b) => Math.hypot(Math.max(b.x - p.x, 0, p.x - b.x - b.w), Math.max(b.y - p.y, 0, p.y - b.y - b.h));
    const holds = (id, t) => { const s = shapes.find((s) => s.id === id); return s && inside(t.b, grow(s.b, 1)); };
    // a legend's sample is a short free line 8 px before its words, by design
    const sample = (e) => !e.m.source && !e.m.target && e.pts.length && (({ w, h }) => Math.max(w, h) <= 48)(union(e.pts.map((p) => ({ x: p.x, y: p.y, w: 0, h: 0 }))));
    for (const e of edges) if (!e.guide && !sample(e)) for (const t of texts) {
      const owner = edges.find((o) => o.id === t.id);
      if (owner === e || holds(e.m.source, t) || holds(e.m.target, t)) continue;
      const close = e.pts.filter((p) => dist(p, t.b) < 12);
      // a line through the words is reported above; one sharing the stretch of the words' own line is that line
      if (!close.length || close.some((p) => dist(p, t.b) <= 1.5)) continue;
      if (owner && close.every((p) => owner.pts.some((q) => Math.abs(p.x - q.x) + Math.abs(p.y - q.y) < 2))) continue;
      out.push("a line (" + e.id + ") passes " + Math.round(Math.min(...close.map((p) => dist(p, t.b)))) + " px from " + quote(t) + ": keep 12 px, or route it on the other side");
    }
    // the page keeps even margins: a cell wider than its words, or a background sized from one, widens it silently
    const page = shapes.find((s) => s.b.w * s.b.h > 0.6 * area);
    const P = page ? page.b : grow({ x: vb.x, y: vb.y, w: vb.width, h: vb.height }, -rules.pad);
    const C = union([...texts.map((t) => t.b), ...shapes.filter((s) => s !== page && s.seen).map((s) => s.b), ...marks,
      ...edges.flatMap((e) => e.pts.map((p) => ({ x: p.x, y: p.y, w: 0, h: 0 })))]);
    for (const [near, far, a, b] of [["left", "right", C.x - P.x, P.x + P.w - C.x - C.w], ["top", "bottom", C.y - P.y, P.y + P.h - C.y - C.h]]) {
      if (Math.abs(a - b) <= 24) continue;
      const [big, small, side] = a > b ? [a, b, near] : [b, a, far];
      const reach = (t) => side === "right" ? t.cell.x + t.cell.w - C.x - C.w : side === "left" ? C.x - t.cell.x : side === "bottom" ? t.cell.y + t.cell.h - C.y - C.h : C.y - t.cell.y;
      const wide = texts.filter((t) => t.cell && reach(t) > 8).sort((p, q) => reach(q) - reach(p))[0];
      out.push("the page has " + Math.round(big) + " px of empty space on the " + side + " and " + Math.round(small) + " on the opposite side: "
        + (wide ? "the cell of " + quote(wide) + " reaches past its words; make it as wide as they are" : "resize the background to the picture"));
    }
    // cards spread apart to line up with a neighbouring box leave a hole that reads as something missing: two cards of
    // one box, one above the other, with a gap taller than a card and nothing in it, no words, no line
    for (const box of shapes) {
      if (box === page || !box.seen) continue;
      const kids = shapes.filter((o) => o !== box && o.seen && inside(o.b, box.b)
        && !shapes.some((m) => m !== box && m !== o && m.seen && inside(o.b, m.b) && inside(m.b, box.b)));
      for (const a of kids) for (const b of kids) {
        const left = Math.max(a.b.x, b.b.x), right = Math.min(a.b.x + a.b.w, b.b.x + b.b.w), gap = b.b.y - a.b.y - a.b.h;
        if (a === b || right - left < 0.5 * Math.min(a.b.w, b.b.w) || gap <= Math.max(a.b.h, b.b.h) + 24) continue;
        const hole = { x: left, y: a.b.y + a.b.h, w: right - left, h: gap };
        const within = (p) => p.x > hole.x && p.x < hole.x + hole.w && p.y > hole.y && p.y < hole.y + hole.h;
        if (kids.some((k) => hit(k.b, hole)) || texts.some((t) => hit(t.b, hole)) || edges.some((e) => e.pts.some(within))) continue;
        out.push(name(box.id) + " has an empty gap of " + Math.round(gap) + " px between " + name(a.id) + " and " + name(b.id)
          + ": stack its cards from the top and let the box end under its last");
      }
    }
    // a zoom names a cell by its id, or by words it shows; words frame the card that holds them, tile and all
    const zooms = zoom.map((z) => {
      const g = svg.querySelector('g[data-cell-id="' + CSS.escape(z) + '"]');
      let b = g && box(g);
      if (!g) {
        const t = texts.find((t) => t.words === z) || texts.find((t) => t.words.includes(z));
        if (!t) return null;
        const card = t.m.edge ? null : shapes.filter((s) => s !== page && inside(t.b, s.b)).sort((p, q) => p.b.w * p.b.h - q.b.w * q.b.h)[0];
        b = card ? card.b : t.b;
      }
      return { id: z, x: b.x - vb.x - 40, y: b.y - vb.y - 40, w: b.w + 80, h: b.h + 80 };
    });
    return { problems: [...new Set(out)], zooms };
  } catch (e) {
    return { error: String((e && e.message) || e) };
  }
}

// 5. Each page: export it, embed the fonts, check it, preview it.
const faces = fontFaces([["Instrument Sans", "instrument-sans"], ["IBM Plex Mono", "ibm-plex-mono"]]);
const found = new Set();
let failed = problems.length > 0;
pages.forEach((p, i) => {
  const suffix = pages.length > 1 ? `-p${i + 1}` : "";
  const label = pages.length > 1 ? `page ${i + 1} (${p.title}): ` : "";
  const svgFile = path.join(outDir, `${name}${suffix}.drawio.svg`);
  for (let n = 1; ; n++) {
    fs.rmSync(svgFile, { force: true });
    try {
      execFileSync(DRAWIO, ["-x", "-f", "svg", "-e", "-b", "0", ...(pages.length > 1 ? ["-p", String(i + 1)] : []), "-o", svgFile, input], { stdio: "ignore" });
    } catch {}
    if (fs.existsSync(svgFile) && fs.statSync(svgFile).size) break;
    // draw.io runs one instance: an export started while another is running can fail silently
    if (n === 8) {
      console.error(`${label}draw.io wrote nothing: check that ${input} opens in draw.io, and that DRAWIO (${DRAWIO}) is the app`);
      process.exit(1);
    }
    sleep(2000 + Math.random() * 3000);
  }
  let svg = fs.readFileSync(svgFile, "utf8");
  // draw.io's own -b border goes once on the left and top but twice on the right and bottom: pad evenly instead
  const pad = 16;
  svg = svg.replace(/<svg[^>]*>/, (root) => {
    const vb = root.match(/viewBox="([^"]*)"/);
    if (!vb) return root;
    const [x, y, w, h] = vb[1].split(/[\s,]+/).map(Number);
    return root.replace(/\swidth="[\d.]+(px)?"/, ` width="${w + 2 * pad}px"`).replace(/\sheight="[\d.]+(px)?"/, ` height="${h + 2 * pad}px"`)
      .replace(/viewBox="[^"]*"/, `viewBox="${x - pad} ${y - pad} ${w + 2 * pad} ${h + 2 * pad}"`);
  });
  // an SVG shown as an image loads nothing external, so the Google Fonts import would fall back to a serif face
  svg = svg.replace(/@import url\("https:\/\/fonts\.googleapis\.com[^"]*"\);?/g, "")
    .replace(/(<svg[^>]*>)/, `$1<style type="text/css">${faces}</style>`);
  for (const [family, fallback] of [["Instrument Sans", "Helvetica Neue, Helvetica, Arial, sans-serif"], ["IBM Plex Mono", "SF Mono, Consolas, Menlo, monospace"]])
    for (const q of [family, `'${family}'`]) svg = svg.split(`font-family="${q}"`).join(`font-family="${q}, ${fallback}"`);
  if (/<foreignObject/.test(svg)) console.warn(`${label}warning: HTML labels, which some viewers will not show (use html=0)`);
  fs.writeFileSync(svgFile, svg);
  // one picture per theme, every light-dark() pair resolved, for a page that picks the theme itself (a README's
  // <picture>): an <img> would otherwise follow the operating system, not the page
  const colour = String.raw`((?:rgba?\([^)]*\)|[^,()])+?)`;
  for (const [theme, k] of [["light", 1], ["dark", 2]]) {
    const one = svg.replace(new RegExp(String.raw`light-dark\(\s*${colour}\s*,\s*${colour}\s*\)`, "g"), (...m) => m[k])
      .replace(/color-scheme:\s*light dark/, `color-scheme: ${theme}`);
    fs.writeFileSync(path.join(outDir, `${name}${suffix}-${theme}.svg`), one);
  }

  const meta = {};
  p.geo = geometries(p.inner);
  for (const c of cellsOf(p.inner)) if (c.a.vertex === "1" || c.a.edge === "1")
    meta[c.a.id] = { edge: c.a.edge === "1", source: c.a.source, target: c.a.target, style: unescapeXml(c.a.style || ""), geo: p.geo[c.a.id] };
  const body = svg.slice(svg.indexOf("<svg"));
  const result = inBrowser("", body, checkPage, meta, zoom, { credit: CREDIT, slop: SLOP, pad });
  const issues = !result ? ["the overlap check could not run (no output from the browser)"]
    : result.error ? [`the overlap check failed in the browser: ${result.error}`] : result.problems;

  // Preview each theme. The SVG is inlined in a page that forces the theme: an <img> takes its theme from the page
  // around it or the operating system, never from a style on the SVG.
  const size = (k) => Math.ceil(parseFloat((body.match(new RegExp(`^<svg[^>]*?\\s${k}="([\\d.]+)`)) || [])[1]) || 800);
  const [w, h] = [size("width"), size("height")];
  const shot = (png, css, factor, width, height) => {
    fs.rmSync(png, { force: true });
    // a browser started while several others run can exit without a screenshot: try three times
    for (let n = 0; n < 3 && !fs.existsSync(png); n++) {
      chrome((tmp) => {
        const page = path.join(tmp, "shot.html");
        fs.writeFileSync(page, `<!doctype html><meta charset="utf-8"><style>${css}</style>${body}`);
        return [`--force-device-scale-factor=${factor}`, `--window-size=${width},${height}`, `--screenshot=${png}`, pathToFileURL(page).href];
      });
      // Edge can return before the file is written
      for (let k = 0; k < 20 && !fs.existsSync(png); k++) sleep(500);
    }
    return fs.existsSync(png);
  };
  const themeCss = (theme, extra = "") => `body{margin:0;overflow:hidden;color-scheme:${theme};background:light-dark(#FFFFFF,#000000)}`
    + `svg{display:block;${extra}color-scheme:${theme}!important}`;
  for (const theme of ["light", "dark"]) {
    const png = path.join(outDir, `${name}${suffix}-${theme}.png`);
    if (shot(png, themeCss(theme), scale, w, h)) console.log(`${label}preview: ${png} (${Math.round(w * scale)} x ${Math.round(h * scale)} px)`);
    else { console.error(`${label}no ${theme} preview; is ${CHROME} Chrome or Edge? Set CHROME.`); failed = true; }
  }
  // a close-up of each cell asked for, at 3x, to read small text without an image tool
  for (const z of (result && result.zooms) || []) {
    if (!z) continue;
    found.add(z.id);
    const slug = z.id.replace(/[^\w-]+/g, "_").slice(0, 40);
    for (const theme of ["light", "dark"]) {
      const png = path.join(outDir, `${name}${suffix}-zoom-${slug}-${theme}.png`);
      if (shot(png, themeCss(theme, `margin:${-z.y}px 0 0 ${-z.x}px;`), 3, Math.ceil(z.w), Math.ceil(z.h))) console.log(`${label}zoom: ${png}`);
    }
  }
  console.log(`${label}preview: ${svgFile}`);
  if (issues.length) {
    failed = true;
    console.error(`${label}overlap check: ${issues.length} problem${issues.length > 1 ? "s" : ""}`);
    for (const x of issues) console.error(`  ${x}`);
  } else console.log(`${label}overlap check: clean`);
});
for (const z of zoom) if (!found.has(z)) console.warn(`zoom: no cell "${z}" (an id, or words a cell shows)`);
if (problems.length) {
  console.error(`model: ${problems.length} problem${problems.length > 1 ? "s" : ""}`);
  for (const x of problems) console.error(`  ${x}`);
}
if (failed) process.exitCode = 1;
