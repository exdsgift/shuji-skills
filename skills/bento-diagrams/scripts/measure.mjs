// Print the width in px of each text as the picture draws it, to size a cell before placing it.
//
//   node measure.mjs [--size 13] [--bold] [--mono] "a step" "the release is done" ...
//
// Uses the fonts in ../assets/fonts and Chrome or Edge, like render.mjs; set CHROME when it is somewhere unusual.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const fonts = path.join(here, "..", "assets", "fonts");
const CHROME = process.env.CHROME || [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].find((p) => fs.existsSync(p)) || "google-chrome";

const args = process.argv.slice(2);
const at = args.indexOf("--size");
const size = at >= 0 ? Number(args[at + 1]) || 13 : 13;
const weight = args.includes("--bold") ? 600 : 400;
const stem = args.includes("--mono") ? "ibm-plex-mono" : "instrument-sans";
const texts = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--size");
if (!texts.length) {
  console.error('usage: node measure.mjs [--size 13] [--bold] [--mono] "text" ...');
  process.exit(2);
}

const face = fs.readFileSync(path.join(fonts, `${stem}-${weight}.woff2`)).toString("base64");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "bento-measure-"));
const page = path.join(tmp, "m.html");
fs.writeFileSync(page, `<!doctype html><meta charset="utf-8"><style>@font-face{font-family:M;font-weight:${weight};
src:url(data:font/woff2;base64,${face}) format("woff2")}</style><pre id="out"></pre><script>
(async () => {
  await document.fonts.load("${weight} ${size}px M");
  const c = document.createElement("canvas").getContext("2d");
  c.font = "${weight} ${size}px M";
  document.getElementById("out").textContent = JSON.stringify(${JSON.stringify(texts)}.map((t) => Math.ceil(c.measureText(t).width)));
})();
</script>`);
let out = "";
try {
  out = execFileSync(CHROME, ["--headless=new", "--disable-gpu", `--user-data-dir=${path.join(tmp, "p")}`,
    "--virtual-time-budget=3000", "--dump-dom", pathToFileURL(page).href], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
} catch {}
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
const widths = JSON.parse((out.match(/<pre id="out">([^<]*)<\/pre>/) || [])[1] || "null");
if (!widths) { console.error(`no browser output; is ${CHROME} Chrome or Edge? Set CHROME.`); process.exit(1); }
texts.forEach((t, i) => console.log(`${widths[i]}\t${t}`));
