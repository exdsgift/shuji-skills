#!/usr/bin/env node
// Render a Mermaid diagram with Pele, theme it, check it, and preview it.
//
//   node render.mjs diagram.mmd [--destination svg|readme|note|pr] [--out DIR] [--now YYYY-MM-DD] [--transparent] [--no-preview]
//   node render.mjs note.md     (checks every ```mermaid block of a Markdown file, as a note; add --destination pr for a PR body)
//
// svg     writes diagram.svg: one file that follows the light and the dark theme, on a solid background.
// readme  writes diagram-light.svg and diagram-dark.svg and prints the <picture> to paste into the README.
// note    writes no file: the host (Obsidian) draws the block with Pele; the block is checked at note and phone width.
// pr      writes no file: GitHub draws the block in a pull request with Mermaid.js 12.1.0, which reads the same syntax
//         as Pele; the block is checked with Pele and previewed with that Mermaid.js in GitHub's light and dark theme.
//
// Pele 1.6.0 comes from npm on the first run, into ~/.cache/sumi-diagrams (PELE_CACHE moves it, PELE points at
// another build); for pr, Mermaid.js 12.1.0 comes from jsDelivr into the same folder, checked against its SHA-256
// (MERMAID points at another mermaid.min.js). Previews need Chrome, Edge or Chromium (CHROME points at one); without a
// browser the checks that need real fonts are skipped and the script says so. Exits 1 while a check finds a problem:
// a diagram is done when it prints "check: clean".
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const PELE_VERSION = "1.6.0";
const SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Cantarell, "Helvetica Neue", Helvetica, Arial, sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';
// the width a reader gives the picture at each destination, and the smallest text worth printing
const WIDTH = { svg: 1000, readme: 880, note: 700, phone: 375, pr: 800 };
const MIN_TEXT_PX = 11;
// the types whose source cannot hold accTitle/accDescr in Pele 1.6.0: they take them as %% comments
const NO_ACC = new Set(["mindmap", "venn", "block", "sankey", "eventmodeling", "c4"]);
// words Pele's flowchart grammar keeps for itself: none of them can be a node id
const RESERVED = "end|call|click|style|class|classDef|subgraph|graph|flowchart|linkStyle|href|interpolate|_self";
const GRAPHS = /^(flowchart|swimlane|agentflow|state|class|er|requirement|c4|architecture|usecase|block)$/;
// GitHub draws a ```mermaid block with this Mermaid.js (read from its viewer, October 2026), with these options,
// in the default theme on white or the dark theme on GitHub's dark page
const MERMAID = { version: "12.1.0", sha256: "6484afc32872a3aa16cac9a76ba1816a1ed4cc870a6593cc2e17757750f518b2" };
const GITHUB = { options: { securityLevel: "antiscript", flowchart: { diagramPadding: 48 }, gantt: { useWidth: 1200 }, pie: { useWidth: 1200 }, sequence: { diagramMarginY: 40 } }, light: "#ffffff", dark: "#0d1117" };
// a pull request diagram marks what the PR touches with these classes only: stroke, so both GitHub themes read it
const PR_CLASSES = { changed: "classDef changed stroke:#f0531a,stroke-width:2px", removed: "classDef removed stroke-dasharray:4 3" };
const PR_NODES = 15;

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const option = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
const input = args.find((a, i) => !a.startsWith("--") && !["--destination", "--out", "--now"].includes(args[i - 1]));
if (!input || !/\.(mmd|md)$/.test(input) || !fs.existsSync(input)) {
  console.error("usage: node render.mjs diagram.mmd [--destination svg|readme|note|pr] [--out DIR] [--now YYYY-MM-DD] [--transparent] [--no-preview]");
  process.exit(2);
}
const isMarkdown = input.endsWith(".md");
const destination = option("--destination") || (isMarkdown ? "note" : "svg");
if (!["svg", "readme", "note", "pr"].includes(destination)) { console.error(`unknown destination "${destination}"`); process.exit(2); }
const name = path.basename(input).replace(/\.(mmd|md)$/, "");
const outDir = path.resolve(option("--out") || path.dirname(input));
const now = option("--now") ? new Date(option("--now")) : new Date();
const transparent = args.includes("--transparent");
const key = crypto.createHash("sha1").update(path.resolve(input)).digest("hex").slice(0, 8);
const previewDir = path.join(os.tmpdir(), "sumi-diagrams", `${name}-${key}`);

// --- Pele -------------------------------------------------------------------------------------------------------
async function loadPele() {
  let file = process.env.PELE;
  if (file && fs.statSync(file).isDirectory()) file = path.join(file, "dist", "pele.js");
  if (!file) {
    const cache = process.env.PELE_CACHE || path.join(os.homedir(), ".cache", "sumi-diagrams", `pele-${PELE_VERSION}`);
    file = path.join(cache, "node_modules", "pele", "dist", "pele.js");
    if (!fs.existsSync(file)) {
      console.error(`installing pele@${PELE_VERSION} into ${cache} (first run only)`);
      fs.mkdirSync(cache, { recursive: true });
      const win = process.platform === "win32";
      try {
        execFileSync(win ? "npm.cmd" : "npm", ["install", `pele@${PELE_VERSION}`, "--prefix", cache, "--ignore-scripts", "--no-audit", "--no-fund", "--loglevel=error"],
          { stdio: ["ignore", "ignore", "inherit"], shell: win });
      } catch {
        console.error(`could not install pele@${PELE_VERSION}: npm needs the network once. Deliver the source and say it was not checked.`);
        process.exit(2);
      }
    }
  }
  const pkg = path.join(path.dirname(file), "..", "package.json");
  const version = fs.existsSync(pkg) ? JSON.parse(fs.readFileSync(pkg, "utf8")).version : "unknown";
  if (version !== PELE_VERSION) console.error(`note: using pele ${version} from ${file}; the skill's rules were checked on ${PELE_VERSION}`);
  return { pele: await import(pathToFileURL(file).href), version };
}
// Mermaid.js for the pull request previews: one file, fetched once and checked against its hash
async function loadMermaid() {
  if (process.env.MERMAID) return process.env.MERMAID;
  const file = path.join(path.dirname(process.env.PELE_CACHE || path.join(os.homedir(), ".cache", "sumi-diagrams", "x")), `mermaid-${MERMAID.version}.min.js`);
  if (fs.existsSync(file)) return file;
  try {
    console.error(`fetching mermaid@${MERMAID.version} into ${path.dirname(file)} (first pull request only)`);
    const body = Buffer.from(await (await fetch(`https://cdn.jsdelivr.net/npm/mermaid@${MERMAID.version}/dist/mermaid.min.js`)).arrayBuffer());
    if (crypto.createHash("sha256").update(body).digest("hex") !== MERMAID.sha256) return null;
    fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, body);
    return file;
  } catch { return null; }
}

// --- theme --------------------------------------------------------------------------------------------------------
const themeFile = fs.readFileSync(path.join(here, "..", "assets", "theme.css"), "utf8");
const part = (marker) => themeFile.split(`/* @${marker} */`)[1].split("/* @")[0];
const squeeze = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/\s*([{};:,>])\s*/g, "$1").trim();
const STYLE = {
  adaptive: squeeze(part("light") + `@media (prefers-color-scheme: dark){${part("dark")}}` + part("rules")),
  light: squeeze(part("light") + part("rules")),
  dark: squeeze(part("light") + part("dark") + part("rules")),
};
// a picture that uses one series colour wears the accent instead: one colour in the theme, not a second one
const single = (svg) => { const used = new Set([...svg.matchAll(/--pele-series-(\d)/g)].map((m) => m[1])); return used.size === 1 ? `.pele{--pele-series-${[...used][0]}:var(--accent)}` : ""; };
const themed = (svg, mode) => svg.replace(/^<svg[^>]*>/, (open) => `${open}<style>${STYLE[mode]}${single(svg)}${transparent ? ".pele{background:none}" : ""}</style>`);
const xml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// --- the source, before Pele sees it ---------------------------------------------------------------------------------
function lintSource(src, type, problems, notes) {
  const body = src.replace(/^---[\s\S]*?\n---\n/, "");
  const lines = body.split("\n");
  const acc = (field) => new RegExp(`^\\s*(%%\\s*)?${field}\\s*[:{]`, "m").test(body);
  if (type === "c4") {
    if (!/^\s*title\s+\S/m.test(body) || !acc("accDescr")) problems.push('give C4 a "title …" line and an "accDescr: …" line: Pele 1.6.0 ignores accTitle in C4, so the title names the SVG');
  } else if (!acc("accTitle") || !acc("accDescr")) {
    problems.push(NO_ACC.has(type)
      ? `add "%% accTitle: …" and "%% accDescr: …" lines: ${type} cannot hold them as statements, so this script writes them into the SVG`
      : `add "accTitle: …" and "accDescr: …" after the first line: they become the SVG's title and description, and the alt text`);
  }
  const keys = (body.match(/:::key\b/g) || []).length + (body.match(/^\s*class\s+[^\n]*\bkey\s*$/gm) || []).length;
  if (keys > 1) problems.push(`${keys} nodes are marked :::key: a diagram is about one thing, so keep the key on one node`);
  if (destination === "pr") prLint(src, body, lines, type, problems, notes);
  else for (const line of lines) {
    if (/^\s*(classDef|style|linkStyle)\b.*(fill|stroke|color)\s*:\s*(#|rgb|[a-z]+\b)/i.test(line))
      notes.push(`"${line.trim()}" sets a fixed colour, which does not follow the dark theme: use :::key or :::ext, or leave it out`);
  }
  if (/^(flowchart|swimlane|agentflow)$/.test(type)) {
    // a style or class on an id that nothing else names creates a stray node
    const declared = new Set();
    for (const line of lines) {
      if (/^\s*(style|class|classDef|linkStyle|click|accTitle|accDescr|%%)\b/.test(line)) continue;
      for (const m of line.matchAll(/(?:^|[\s&>|-])([A-Za-z_][\w.-]*)(?=\s*(?:[[({>@:]|-->|---|-\.|==|&|$|\s))/g)) declared.add(m[1]);
    }
    for (const line of lines) {
      const m = line.match(/^\s*(style|class)\s+([\w.-]+(?:\s*,\s*[\w.-]+)*)/);
      if (!m) continue;
      for (const id of m[2].split(",").map((x) => x.trim()).filter(Boolean)) if (!declared.has(id)) problems.push(`"${line.trim()}" names "${id}", which no edge or node uses: it would draw an empty node`);
    }
    for (const m of body.matchAll(/(--+|==+|-\.+-)([ox])([A-Za-z_]\w*)/g))
      notes.push(`"${m[0]}" is an edge with a ${m[2] === "o" ? "circle" : "cross"} end into "${m[3]}"; write "${m[1]} ${m[2]}${m[3]}", with a space, if "${m[2]}${m[3]}" is the node's name`);
  }
  if (/^(flowchart|swimlane|agentflow)$/.test(type)) {
    // Pele stops at the first parse error: name every known one at once
    for (const line of lines) {
      const t = line.trim();
      const word = (t.match(new RegExp(`(?:-->|---|==>|-\\.->|\\||&)\\s*(${RESERVED})(?=\\s*$|\\s*[[({&]|\\s*-->)|^(${RESERVED})(?=[[({]|\\s*(?:-->|---|==>|-\\.|&))`)) || []).slice(1).find(Boolean);
      if (word) problems.push(`"${t}" uses "${word}" as a node: it is a keyword, so give the node another id (${word === "end" ? "End, done or finish" : `${word}_step`})`);
      if (/\S.*%%/.test(line) && !/^\s*%%/.test(line)) problems.push(`"${t}" has a %% comment after code: give the comment a line of its own`);
      for (const m of line.matchAll(/[\w-]\[(?![[(/\\"])([^\]"]*)\]/g)) if (/[(){}|@]/.test(m[1])) problems.push(`the label [${m[1]}] holds ( ) { } | or @: put it in double quotes, ["${m[1]}"]`);
      for (const m of line.matchAll(/[\w-]\((?![([("])([^)"]*)\)/g)) if (/[[\]{}|@(]/.test(m[1])) problems.push(`the label (${m[1]}) holds [ ] { } | or @: put it in double quotes, ("${m[1]}")`);
      for (const m of line.matchAll(/\|([^|"]+)\|/g)) if (/[()[\]{}@]/.test(m[1])) problems.push(`the edge label |${m[1]}| holds brackets or @: put it in double quotes, |"${m[1]}"|`);
    }
  }
  if (/^(flowchart|swimlane|agentflow|state|er|class|gantt)$/.test(type)) {
    for (const line of lines) {
      if (type === "class" && !/(<\|--|-->|--\*|--o|\.\.>|\.\.\|>|--|\.\.)\s*\S+\s*:/.test(line)) continue;
      for (const m of line.matchAll(/(?<!<)<(?!\/?(br|b|i|u|em|strong|sub|sup|s)\b)([A-Za-z][^<>\s]*)>(?!>)/gi))
        problems.push(`"${m[0]}" in "${line.trim()}" is read as an HTML tag and dropped from the picture: write #lt;${m[2]}#gt;`);
    }
  }
  if (type === "timeline") for (const line of lines) {
    const m = line.match(/^\s*([^:%]*\d):(\d[^:]*?)\s+:/);
    if (m) problems.push(`"${line.trim()}" puts a colon inside the period, which ends it: write ${m[1].trim()}#58;${m[2].trim()} (it prints as ${m[1].trim()}:${m[2].trim()})`);
  }
  if (type === "gantt") {
    const fmt = (body.match(/^\s*dateFormat\s+(\S+)/m) || [, "YYYY-MM-DD"])[1];
    if (fmt === "YYYY-MM-DD") for (const m of body.matchAll(/:[^\n]*?\b(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})\b/g))
      if (!/^\d{4}-\d{2}-\d{2}$/.test(m[1])) problems.push(`the date "${m[1]}" does not match dateFormat YYYY-MM-DD: Pele would draw that task nowhere`);
  }
  if (type === "sankey" && /[^\x00-\x7f]/.test(body)) problems.push("sankey node names must be plain ASCII in Pele 1.6.0 (accents, CJK and emoji fail): transliterate them");
  for (const m of body.matchAll(/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]{13,}/g)) notes.push(`"${m[0].slice(0, 12)}…" will not wrap (Pele wraps only at spaces): shorten it or add spaces`);
}
// GitHub draws the block in its own theme: only a stroke reads in both, and only the two pull request classes mean anything
function prLint(src, body, lines, type, problems, notes) {
  if (/:::(key|ext)\b|^\s*class\s+\S+\s+(key|ext)\s*$/m.test(body))
    problems.push("GitHub does not carry the sumi theme, so :::key and :::ext draw nothing there: mark what the pull request adds or changes :::changed, and what it deletes :::removed");
  for (const line of lines) {
    if (/^\s*(classDef|style)\b.*\b(fill|color)\s*:/i.test(line)) problems.push(`"${line.trim()}" sets a fill or a text colour, which reads in one GitHub theme only: keep to stroke, stroke-width and stroke-dasharray`);
    const def = line.match(/^\s*classDef\s+(\S+)/);
    if (def && !PR_CLASSES[def[1]]) problems.push(`"${line.trim()}": a pull request diagram uses two classes, ${Object.values(PR_CLASSES).join(" and ")}`);
  }
  for (const [cls, def] of Object.entries(PR_CLASSES)) {
    const used = new RegExp(`:::${cls}\\b|^\\s*class\\s+\\S+\\s+${cls}\\s*$`, "m").test(body);
    if (used && !new RegExp(`^\\s*classDef\\s+${cls}\\b`, "m").test(body)) problems.push(`nodes are marked ${cls} but nothing defines it: add "${def}"`);
  }
  // Mermaid.js 12.1 prints the first series' values on every series' bars
  if (type === "xychart" && /showDataLabel\s*:\s*true/.test(src) && (body.match(/^\s*(bar|line)\b/gm) || []).length > 1)
    problems.push("showDataLabel with two or more series: GitHub's Mermaid.js 12.1 prints the first series' values on the others' bars; leave it out and give the numbers in the caption");
  if (/^(flowchart|state|class|er)$/.test(type) && !/:::changed\b|^\s*class\s+\S+\s+changed\s*$/m.test(body))
    notes.push("nothing is marked :::changed: mark what the pull request adds or changes, or say in the caption that this is the shape before it");
}

// Pele's messages are Mermaid's; add the fix for the ones agents meet most
function hint(e, src) {
  const m = e.message, failing = src.split("\n")[(e.line || 1) - 1] || "";
  if (/\S.*%%/.test(failing) && !/^\s*%%/.test(failing)) return "a %% comment after code breaks the line: give the comment a line of its own";
  if (/got 'PS'|got 'PE'|got 'PIPE'|got 'SQS'|got 'DIAMOND_START'/.test(m)) return 'a label holds ( ) [ ] { } or |: put the whole label in double quotes, A["fn(x) | y"]';
  if (/got 'end'/.test(m)) return '"end" is a keyword: name the node End, done or finish';
  if (e.type === "timeline" && /\d:\d/.test(failing)) return "a period cannot hold a colon: write 09#58;12 for 09:12";
  if (/Expecting 'TXT', got 'NEWLINE'/.test(m)) return 'a note or message needs ": text", as in Note over A,B: text';
  if (/DEPENDENCY/.test(m)) return "generics are written with tildes: class Repo~T~";
  if (e.type === "c4" && !/^\s*(---[\s\S]*?---\s*)?C4/.test(src)) return "Pele 1.6.0 reads any text containing C4Container, C4Component, C4Dynamic or C4Deployment as a C4 diagram: reword that label";
  if (/sankey/.test(e.type || "")) return "sankey rows are source,target,value with plain ASCII names and no quotes";
  if (/architecture/.test(e.type || "") && /':'/.test(m)) return "architecture edges name their sides: a:R --> L:b";
  if (/linkStyle/.test(m)) return "a linkStyle index counts edges from 0 in source order";
  return "";
}

// --- geometry, from Pele's own coordinates --------------------------------------------------------------------------
function boxes(svg) {
  const nodes = [];
  for (const m of svg.matchAll(/<g class="pele-node[^"]*" data-id="([^"]*)" transform="translate\(([-\d.]+),([-\d.]+)\)">([\s\S]*?)<\/g>/g)) {
    const [, id, tx, ty, inner] = m, x0 = +tx, y0 = +ty;
    const rect = inner.match(/<rect x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)"/);
    let nums = rect ? [+rect[1], +rect[2], +rect[1] + +rect[3], +rect[2] + +rect[4]] : null;
    if (!nums) {
      const poly = inner.match(/points="([^"]*)"/), d = inner.match(/ d="([^"]*)"/);
      const xs = [], ys = [];
      if (poly) (poly[1].match(/-?[\d.]+/g) || []).forEach((v, i) => (i % 2 ? ys : xs).push(+v));
      else if (d) {
        let cx = 0, cy = 0;
        for (const [, cmd, rest] of d[1].matchAll(/([MLHVCSQTAZ])([^MLHVCSQTAZ]*)/gi)) {
          const n = (rest.match(/-?[\d.]+(?:e-?\d+)?/g) || []).map(Number), C = cmd.toUpperCase(), rel = cmd !== C;
          const step = { M: 2, L: 2, T: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, A: 7, Z: 0 }[C];
          for (let i = 0; step && i + step <= n.length; i += step) {
            const seg = n.slice(i, i + step);
            if (C === "H") cx = rel ? cx + seg[0] : seg[0]; else if (C === "V") cy = rel ? cy + seg[0] : seg[0];
            else { const x = seg[step - 2], y = seg[step - 1]; cx = rel ? cx + x : x; cy = rel ? cy + y : y; }
            xs.push(cx); ys.push(cy);
            if (C === "A") { const r = seg[0]; xs.push(cx - r, cx + r); ys.push(cy - seg[1], cy + seg[1]); }
          }
        }
      }
      if (xs.length < 2) continue;
      nums = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    }
    nodes.push({ id, x1: x0 + nums[0], y1: y0 + nums[1], x2: x0 + nums[2], y2: y0 + nums[3] });
  }
  const edges = [];
  for (const m of svg.matchAll(/<g class="pele-edge[^"]*" data-id="([^"]*)"><path d="([^"]*)"/g)) {
    const pts = []; let cur = [0, 0];
    for (const [, cmd, rest] of m[2].matchAll(/([MLCQHVZ])([^MLCQHVZ]*)/gi)) {
      const n = (rest.match(/-?[\d.]+/g) || []).map(Number);
      if (/[ML]/i.test(cmd)) for (let i = 0; i + 1 < n.length; i += 2) { const p = [n[i], n[i + 1]]; if (cmd === "L") for (let t = 1; t <= 8; t++) pts.push([cur[0] + (p[0] - cur[0]) * t / 8, cur[1] + (p[1] - cur[1]) * t / 8]); else pts.push(p); cur = p; }
      else if (/C/i.test(cmd)) for (let i = 0; i + 5 < n.length; i += 6) { const [a, b, c] = [[n[i], n[i + 1]], [n[i + 2], n[i + 3]], [n[i + 4], n[i + 5]]]; for (let t = 1; t <= 10; t++) { const u = t / 10, v = 1 - u; pts.push([v * v * v * cur[0] + 3 * v * v * u * a[0] + 3 * v * u * u * b[0] + u * u * u * c[0], v * v * v * cur[1] + 3 * v * v * u * a[1] + 3 * v * u * u * b[1] + u * u * u * c[1]]); } cur = c; }
      else if (/Q/i.test(cmd)) for (let i = 0; i + 3 < n.length; i += 4) { const [a, c] = [[n[i], n[i + 1]], [n[i + 2], n[i + 3]]]; for (let t = 1; t <= 8; t++) { const u = t / 8, v = 1 - u; pts.push([v * v * cur[0] + 2 * v * u * a[0] + u * u * c[0], v * v * cur[1] + 2 * v * u * a[1] + u * u * c[1]]); } cur = c; }
    }
    edges.push({ id: m[1], pts });
  }
  const labels = [...svg.matchAll(/<g class="pele-edge-label" data-id="([^"]*)"><rect x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)"[^>]*\/><text[^>]*>([^<]*)/g)]
    .map((m) => ({ id: m[1], x1: +m[2], y1: +m[3], x2: +m[2] + +m[4], y2: +m[3] + +m[5], text: m[6] }));
  return { nodes, edges, labels };
}
function geometry(svg, problems, notes) {
  const { nodes, edges, labels } = boxes(svg);
  const inside = (p, n, pad) => p[0] > n.x1 + pad && p[0] < n.x2 - pad && p[1] > n.y1 + pad && p[1] < n.y2 - pad;
  const near = (p, n) => p[0] > n.x1 - 8 && p[0] < n.x2 + 8 && p[1] > n.y1 - 8 && p[1] < n.y2 + 8;
  for (const e of edges) {
    if (e.pts.length < 2) continue;
    const ends = nodes.filter((n) => near(e.pts[0], n) || near(e.pts.at(-1), n));
    for (const n of nodes) if (!ends.includes(n) && e.pts.some((p) => inside(p, n, 3))) problems.push(`an edge (${e.id}) runs through "${n.id}": reorder the nodes, change the direction, or add a subgraph`);
  }
  // two edges that share no node and still cross: Pele lays out in source order, so another order often clears it
  const endsOf = (e) => nodes.filter((n) => near(e.pts[0], n) || near(e.pts.at(-1), n)).map((n) => n.id);
  const cross = (a, b, c, d) => { const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]); return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0; };
  const lined = edges.filter((e) => e.pts.length > 1).map((e) => ({ ...e, ends: endsOf(e) }));
  const crossings = [];
  for (let i = 0; i < lined.length; i++) for (let j = i + 1; j < lined.length; j++) {
    const a = lined[i], b = lined[j];
    if (a.ends.some((x) => b.ends.includes(x))) continue;
    let hit = false;
    for (let p = 0; p + 1 < a.pts.length && !hit; p++) for (let q = 0; q + 1 < b.pts.length && !hit; q++) hit = cross(a.pts[p], a.pts[p + 1], b.pts[q], b.pts[q + 1]);
    if (hit) crossings.push(`${a.id} and ${b.id}`);
  }
  if (crossings.length) notes.push(`${crossings.length} pair${crossings.length > 1 ? "s" : ""} of edges cross (${crossings.slice(0, 2).join("; ")}${crossings.length > 2 ? "; …" : ""}): Pele lays out in source order, so declare the edges in another order or flip the direction, and keep the layout with the fewest crossings`);
  const overlap = (a, b) => Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1) > 1 && Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1) > 1;
  const worded = labels.filter((l) => l.text.trim());
  for (const l of worded) for (const n of nodes) if (overlap(l, n)) problems.push(`the edge label "${l.text}" covers "${n.id}": shorten it or move it to the caption`);
  for (let i = 0; i < worded.length; i++) for (let j = i + 1; j < worded.length; j++) if (overlap(worded[i], worded[j])) problems.push(`the edge labels "${worded[i].text}" and "${worded[j].text}" overlap: shorten one`);
}
function fits(width, budget, where, problems) {
  if (width <= budget) return;
  const px = (16 * budget) / width;
  if (px < MIN_TEXT_PX) problems.push(`at ${where} width (${budget} px) this ${Math.round(width)} px picture shrinks its text to ${px.toFixed(1)} px: turn LR into TB, shorten labels, or split it into two diagrams`);
}

// --- browser ----------------------------------------------------------------------------------------------------------
function findBrowser() {
  const home = os.homedir();
  const list = [process.env.CHROME,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge", "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/microsoft-edge"];
  for (const cache of [path.join(home, "Library", "Caches", "ms-playwright"), path.join(home, ".cache", "ms-playwright"), path.join(process.env.LOCALAPPDATA || "", "ms-playwright")]) {
    if (!fs.existsSync(cache)) continue;
    for (const dir of fs.readdirSync(cache).filter((d) => /^chromium/.test(d)).sort().reverse()) {
      const root = path.join(cache, dir);
      for (const sub of fs.readdirSync(root)) for (const exe of ["chrome-headless-shell", "chrome", "Chromium.app/Contents/MacOS/Chromium", "chrome-headless-shell.exe", "chrome.exe"]) list.push(path.join(root, sub, exe));
    }
  }
  return list.find((p) => p && fs.existsSync(p));
}
function chrome(browser, flags, budget = 4000) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sumi-diagrams-"));
  try {
    return execFileSync(browser, ["--headless", "--disable-gpu", "--hide-scrollbars", "--run-all-compositor-stages-before-draw", `--virtual-time-budget=${budget}`, `--user-data-dir=${path.join(tmp, "p")}`, ...flags(tmp)],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 << 20 });
  } catch { return ""; } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}
const page = (svg, width, dark, bg = dark ? "#151515" : "#ffffff") => `<!doctype html><meta charset="utf-8"><meta name="color-scheme" content="${dark ? "dark" : "light"}"><style>html,body{margin:0;background:${bg}}#d{width:${width}px}#d svg{display:block;width:100%;height:auto;max-width:none!important}</style><div id="d">${svg}</div>`;
// text that overlaps text, and words that run out of their box, as the reader's browser lays them out
function browserCheck(browser, svg, width, problems) {
  const probe = `<script>(()=>{const out=[],root=document.querySelector('#d svg');
const quad=t=>{const b=t.getBBox(),m=t.getScreenCTM();return [[b.x,b.y],[b.x+b.width,b.y],[b.x+b.width,b.y+b.height],[b.x,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(m))};
const apart=(P,Q)=>{for(const R of [P,Q])for(let i=0;i<4;i++){const a=R[i],b=R[(i+1)%4],nx=b.y-a.y,ny=a.x-b.x,l=Math.hypot(nx,ny)||1,p=P.map(v=>(v.x*nx+v.y*ny)/l),q=Q.map(v=>(v.x*nx+v.y*ny)/l);if(Math.min(...p)-Math.max(...q)>=-1||Math.min(...q)-Math.max(...p)>=-1)return true}return false};
const texts=[...root.querySelectorAll('text')].filter(t=>t.textContent.trim()).map(t=>({t,q:quad(t),g:t.closest('[data-id]')?.dataset.id||''}));
for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){const a=texts[i],b=texts[j];if(a.g&&a.g===b.g)continue;if(!apart(a.q,b.q))out.push('"'+a.t.textContent.slice(0,24)+'" overlaps "'+b.t.textContent.slice(0,24)+'"')}
for(const g of root.querySelectorAll('.pele-node')){const s=g.querySelector('rect'),t=g.querySelector('text');if(!s||!t)continue;const a=s.getBoundingClientRect(),b=t.getBoundingClientRect(),cy=(b.top+b.bottom)/2;if(cy<a.top||cy>a.bottom)continue;const o=Math.max(a.left-b.left,b.right-a.right);if(o>1)out.push('"'+t.textContent.slice(0,24)+'" runs '+o.toFixed(1)+' px past its box')}
document.title='@@'+btoa(unescape(encodeURIComponent(JSON.stringify(out))))+'@@'})()</script>`;
  const dom = chrome(browser, (tmp) => { const f = path.join(tmp, "p.html"); fs.writeFileSync(f, page(svg, width, false) + probe); return ["--dump-dom", pathToFileURL(f).href]; });
  const found = dom.match(/@@([^@]+)@@/);
  if (!found) return false;
  for (const p of JSON.parse(Buffer.from(found[1], "base64").toString("utf8"))) problems.push(p);
  return true;
}
function screenshot(browser, svg, width, height, dark, file, bg, sparse = false) {
  for (let n = 0; n < 3; n++) {
    chrome(browser, (tmp) => { const f = path.join(tmp, "p.html"); fs.writeFileSync(f, page(svg, width, dark, bg));
      return ["--force-device-scale-factor=2", `--blink-settings=preferredColorScheme=${dark ? 0 : 1}`, `--window-size=${Math.ceil(width)},${Math.ceil(height)}`, `--screenshot=${file}`, pathToFileURL(f).href]; });
    // a capture taken before the page painted is one flat colour, which compresses to almost nothing (about 0.0045
    // bytes a pixel); Mermaid's thin lines on a bare page weigh less than Pele's filled boxes
    if (fs.existsSync(file) && fs.statSync(file).size > Math.max(1200, width * height * 4 * (sparse ? 0.007 : 0.015))) return true;
  }
  return false;
}
// the block as GitHub draws it: Mermaid.js renders asynchronously, so take its SVG from the DOM, then photograph that
function github(browser, lib, src) {
  const code = JSON.stringify(src).replace(/</g, "\\u003c");
  const run = `<script src="${pathToFileURL(lib).href}"></script><script>(async()=>{const out={};for(const theme of ["default","dark"]){mermaid.initialize({startOnLoad:false,...${JSON.stringify(GITHUB.options)},theme});try{out[theme]=(await mermaid.render("m"+theme,${code})).svg}catch(e){out.error=String(e.message||e).split("\\n").slice(0,3).join(" ");break}}document.title="@@"+btoa(unescape(encodeURIComponent(JSON.stringify(out))))+"@@"})()</script>`;
  for (let n = 0; n < 3; n++) {
    const dom = chrome(browser, (tmp) => { const f = path.join(tmp, "p.html"); fs.writeFileSync(f, `<!doctype html><meta charset="utf-8"><body>${run}`); return ["--allow-file-access-from-files", "--dump-dom", pathToFileURL(f).href]; }, 20000);
    const found = dom.match(/@@([^@]+)@@/);
    if (found) return JSON.parse(Buffer.from(found[1], "base64").toString("utf8"));
  }
  return null;
}

// --- one diagram -------------------------------------------------------------------------------------------------------
async function run() {
  const { pele, version } = await loadPele();
  const text = fs.readFileSync(input, "utf8");
  const sources = isMarkdown ? [...text.matchAll(/```mermaid\n([\s\S]*?)```/g)].map((m) => m[1]) : [text];
  if (!sources.length) { console.error(`no \`\`\`mermaid block in ${input}`); process.exit(1); }
  const browser = args.includes("--no-preview") ? null : findBrowser();
  let failed = false;
  for (const [i, src] of sources.entries()) {
    const label = sources.length > 1 ? `block ${i + 1}: ` : "";
    const problems = [], notes = [];
    const type = pele.detectType(src) || "unknown";
    lintSource(src, type, problems, notes);
    const options = { fontFamily: SANS, fontFamilyMono: MONO, padding: 24, idPrefix: `${name}-${i}`, now };
    let result;
    try { result = pele.render(src, destination === "note" ? { ...options, maxWidth: WIDTH.note } : options); }
    catch (e) {
      const where = e.line ? ` at line ${e.line}, column ${e.column}` : "";
      console.log(`${label}${e.code || "error"}${where}: ${e.message.split("\n")[0]}`);
      if (e.snippet) console.log(e.snippet.replace(/^/gm, "  "));
      // the lint already names each broken label, so the generic label hint would only repeat it
      const fix = hint(e, src), named = problems.some((p) => /^the (edge )?label/.test(p));
      if (fix && !(named && /^a label holds/.test(fix))) console.log(`  fix: ${fix}`);
      for (const p of [...new Set(problems)]) console.log(`  also: ${p}`);
      console.log(`${label}check: failed`); failed = true; continue;
    }
    let svg = result.svg;
    // the five types that cannot hold accTitle/accDescr take them from %% comments
    // a root title follows the <svg> tag; sankey's per-link tooltips are <title>s too, so look only there
    if (!/^<svg[^>]*>\s*<title/.test(svg)) {
      const t = (src.match(/^\s*%%\s*accTitle\s*:\s*(.+)$/m) || src.match(/^\s*accTitle\s*:\s*(.+)$/m) || (result.type === "c4" && src.match(/^\s*title\s+(.+)$/m)) || [])[1];
      const d = (src.match(/^\s*%%\s*accDescr\s*:\s*(.+)$/m) || src.match(/^\s*accDescr\s*:\s*(.+)$/m) || [])[1];
      if (t) svg = svg.replace(/^(<svg[^>]*>)/, `$1<title id="${name}-${i}-title">${xml(t.trim())}</title>${d && !/<desc/.test(svg) ? `<desc id="${name}-${i}-desc">${xml(d.trim())}</desc>` : ""}`)
        .replace(/^<svg /, `<svg aria-labelledby="${name}-${i}-title"${d && !/<desc/.test(svg) ? ` aria-describedby="${name}-${i}-desc"` : ""} `);
    }
    // GitHub lays the block out with Mermaid.js, so Pele's coordinates say nothing about it: the preview does
    if (destination === "pr") {
      const count = boxes(svg).nodes.length;
      if (GRAPHS.test(result.type) && count > PR_NODES) problems.push(`${count} nodes: a pull request diagram shows the part the PR touches and its neighbours, ${PR_NODES} at most; cut the rest or split it`);
    } else {
      if (GRAPHS.test(result.type)) geometry(svg, problems, notes);
      fits(result.width, WIDTH[destination], destination === "svg" ? "page" : destination, problems);
    }
    if (destination === "note") {
      const phone = pele.render(src, { ...options, maxWidth: WIDTH.phone });
      if (phone.width > WIDTH.phone) notes.push(`on a phone the picture stays ${Math.round(phone.width)} px wide and is scaled down: fine for a note read on a computer`);
    }
    // files
    const written = [];
    if (destination === "svg" || destination === "readme") fs.mkdirSync(outDir, { recursive: true });
    const title = (svg.match(/^<svg[^>]*>\s*<title[^>]*>([^<]*)<\/title>/) || [, name])[1];
    const alt = (svg.match(/^<svg[^>]*>\s*<title[^>]*>[^<]*<\/title>\s*<desc[^>]*>([^<]*)<\/desc>/) || [, title])[1];
    if (destination === "svg") { const f = path.join(outDir, `${name}.svg`); fs.writeFileSync(f, themed(svg, "adaptive")); written.push(f); }
    if (destination === "readme") for (const mode of ["light", "dark"]) { const f = path.join(outDir, `${name}-${mode}.svg`); fs.writeFileSync(f, themed(svg, mode)); written.push(f); }
    // the browser: real fonts, then previews of both themes
    const previews = [];
    if (browser && destination === "pr") {
      const lib = await loadMermaid();
      const drawn = lib && github(browser, lib, src);
      if (!lib) notes.push(`could not fetch mermaid@${MERMAID.version}: the block was checked with Pele, which reads the same syntax, but not drawn as GitHub draws it`);
      else if (!drawn) notes.push(`the browser at ${browser} returned nothing: the block was not drawn as GitHub draws it`);
      else if (drawn.error) problems.push(`GitHub's Mermaid.js ${MERMAID.version} rejects the block: ${drawn.error}`);
      else {
        const box = (drawn.default.match(/viewBox="[-\d.]+ [-\d.]+ ([\d.]+) ([\d.]+)"/) || []).slice(1).map(Number);
        if (box.length) {
          fits(box[0], WIDTH.pr, "pull request", problems);
          const shown = Math.ceil(Math.min(box[0], WIDTH.pr)), high = (box[1] * shown) / box[0];
          fs.mkdirSync(previewDir, { recursive: true });
          for (const [mode, theme] of [["light", "default"], ["dark", "dark"]]) {
            const f = path.join(previewDir, `${name}${label ? "-" + (i + 1) : ""}-github-${mode}.png`);
            if (screenshot(browser, drawn[theme], shown, high, mode === "dark", f, GITHUB[mode], true)) previews.push(f);
          }
        }
        if (previews.length < 2) notes.push("the browser did not return both GitHub previews: look at the block in the pull request once it is open");
      }
    } else if (browser) {
      const shown = Math.min(result.width, WIDTH[destination]), high = (result.height * shown) / result.width;
      if (!browserCheck(browser, themed(svg, "light"), shown, problems)) notes.push(`the browser at ${browser} returned nothing: font checks skipped`);
      fs.mkdirSync(previewDir, { recursive: true });
      for (const mode of ["light", "dark"]) {
        const f = path.join(previewDir, `${name}${label ? "-" + (i + 1) : ""}-${mode}.png`);
        if (screenshot(browser, themed(svg, "adaptive"), shown, high, mode === "dark", f)) previews.push(f);
      }
    } else if (!args.includes("--no-preview")) notes.push(destination === "pr"
      ? "no Chrome, Edge or Chromium found (set CHROME): the block was checked with Pele, which reads the same syntax as GitHub, but not drawn as GitHub draws it"
      : "no Chrome, Edge or Chromium found (set CHROME): text was not measured in a real font and no preview was made; look at the SVG in a browser before delivering");
    // report
    console.log(`${label}pele ${version} · ${result.type} · ${Math.round(result.width)} x ${Math.round(result.height)} · destination ${destination} (${WIDTH[destination]} px)`);
    for (const f of written) console.log(`wrote ${path.relative(process.cwd(), f) || f}`);
    if (previews.length) console.log(`previews: ${previews.join("  ")}`);
    if (destination === "pr" && !isMarkdown) console.log(`paste ${path.basename(input)} into the pull request body as a \`\`\`mermaid block, with a one-line caption`);
    if (destination === "readme") console.log(`<picture>\n  <source media="(prefers-color-scheme: dark)" srcset="${name}-dark.svg">\n  <img src="${name}-light.svg" alt="${alt}">\n</picture>`);
    for (const n of [...new Set(notes)]) console.log(`note: ${n}`);
    const unique = [...new Set(problems)];
    console.log(`${label}check: ${unique.length ? `${unique.length} problem${unique.length > 1 ? "s" : ""}` : "clean"}`);
    for (const p of unique) console.log(`  ${p}`);
    if (unique.length) failed = true;
  }
  process.exit(failed ? 1 : 0);
}
run();
