// Print the draw.io style of an icon, its SVG embedded, ready to paste into a cell.
//
//   node icon.mjs lucide:<name> [#hex]   a Lucide glyph, white unless a colour is given (https://lucide.dev/icons)
//   node icon.mjs lobe:<slug> [#hex]     an AI brand from LobeHub, <slug>-color when it exists (https://icons.lobehub.com)
//   node icon.mjs si:<slug>              any other brand from Simple Icons, in its brand colour (https://simpleicons.org)
//
// Needs Node 18+ and the network; each SVG is kept in the system temp folder so a second run needs neither. The
// packages are pinned, so a glyph stays the one that was reviewed; raise the versions on purpose, then look again.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const LUCIDE = "lucide-static@1.57.0", LOBE = "@lobehub/icons-static-svg@1.95.1";
const [spec, colour] = process.argv.slice(2);
const [source, name] = (spec || "").split(":");
const urls = {
  lucide: `https://unpkg.com/${LUCIDE}/icons/${name}.svg`,
  lobe: `https://unpkg.com/${LOBE}/icons/${name}.svg`,
  si: `https://cdn.simpleicons.org/${name}`,
};
if (!urls[source] || !name || !/^[\w.-]+$/.test(name)) {
  console.error("usage: node icon.mjs lucide:<name> [#hex] | lobe:<slug> [#hex] | si:<slug>");
  process.exit(2);
}
const get = async (url) => {
  try { return await fetch(url); } catch (e) {
    console.error(`could not reach ${url} (${e.cause?.code || e.message}); check the network and try again`);
    process.exit(1);
  }
};
const cache = path.join(os.tmpdir(), "bento-icons", `${source}-${source === "si" ? "" : (source === "lucide" ? LUCIDE : LOBE).replace(/\W+/g, "_") + "-"}${name}.svg`);
let svg = fs.existsSync(cache) ? fs.readFileSync(cache, "utf8") : null;
if (!svg) {
  // LobeHub keeps the brand colours in <slug>-color: try it first
  let res = source === "lobe" && !name.endsWith("-color") ? await get(urls.lobe.replace(/\.svg$/, "-color.svg")) : null;
  if (!res || !res.ok) res = await get(urls[source]);
  if (!res.ok) {
    console.error(`no ${spec} (${res.status} from ${urls[source]}); browse the source for its exact name, or pick another glyph for the same function`);
    process.exit(1);
  }
  svg = await res.text();
  fs.mkdirSync(path.dirname(cache), { recursive: true });
  fs.writeFileSync(cache, svg);
}
// a glyph drawn in currentColor turns black once embedded: give it white for a tile, or the colour asked for
if (source !== "si") svg = svg.replaceAll("currentColor", colour || (source === "lucide" ? "#FFFFFF" : "#000000"));
console.log(`shape=image;aspect=fixed;imageAspect=0;image=data:image/svg+xml,${Buffer.from(svg).toString("base64")};`);
