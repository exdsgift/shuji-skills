// Build showcase/<name>-split.svg from the <name>-light.svg and <name>-dark.svg that render.mjs wrote in a folder: the
// picture in the light theme on its left half and the dark theme on its right, for the README's "One file, both
// themes".
//
//   node showcase/split.mjs job-states <the folder render.mjs wrote>
//
// Both themes are embedded as data URIs, so the image needs nothing else to show where GitHub serves it.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const [name, from = here] = process.argv.slice(2);
const read = (theme) => fs.readFileSync(path.join(from, `${name}-${theme}.svg`));
const [light, dark] = [read("light"), read("dark")];
// draw.io keeps the whole model in the root tag's content attribute, so read the tag whole
const root = light.toString("utf8").match(/<svg[^>]*>/)[0];
const [w, h] = ["width", "height"].map((k) => parseFloat(root.match(new RegExp(`\\s${k}="([\\d.]+)`))[1]));
const uri = (svg) => `data:image/svg+xml;base64,${svg.toString("base64")}`;
fs.writeFileSync(path.join(here, `${name}-split.svg`), `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><clipPath id="dark-half"><rect x="${w / 2}" y="0" width="${w / 2}" height="${h}"/></clipPath></defs>
<image width="${w}" height="${h}" href="${uri(light)}"/>
<image width="${w}" height="${h}" href="${uri(dark)}" clip-path="url(#dark-half)"/>
</svg>
`);
console.log(`${name}-split.svg ${w} x ${h}`);
