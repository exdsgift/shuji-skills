# Changelog

What changed in bento-diagrams, newest first. There are no version numbers: each push to `main` is a release, and
`npx skills update` or `claude plugin update bento-diagrams@shuji` brings it.

## 2026-10-15

### License

- The skill is under the MIT license, with a copy in its folder. A diagram's layout and words are yours to use without
  its notice; the embedded fonts (SIL OFL) and Lucide glyphs (ISC) keep their own terms.

### A lighter showcase

- The README shows five pictures instead of ten, each large enough to read: the optimizer, a failover ladder beside
  the AWS topology, the roadmap, and a managed job's states split between the light and the dark theme. Its title
  carries 🍱 and 弁当.
- `showcase/split.mjs` builds the split picture from the two themes render.mjs writes.

### After a round on SkyPilot's source

Fourteen pictures of SkyPilot's internals, drawn by agents with the skill, showed where its rules left them guessing.
This release writes those rules down and makes the check stricter.

The check, `scripts/render.mjs`:

- Sees near misses: words closer than 6 px on a row, a line within 12 px of words it neither carries nor enters, and
  words that run past a diamond's slanted sides.
- Reports a page whose margins differ by more than 24 px, naming the cell wider than its words, and a hole inside a
  box: two of its cards with an empty gap taller than a card between them.
- Checks a text cell drawn with `pointerEvents=0`, which draw.io exports with no box, against its geometry.
- Turns a tinted logo tile into a chip when the logo would fade: a light chip under a dark mark in the dark theme
  (under 3:1), a dark one under a pale mark in the light theme (under 2:1).
- Writes `-light.svg` and `-dark.svg`, one theme each, for a page that picks the theme itself.
- `--zoom` by words frames the whole card, and an id wins over words.
- Tries the browser three times when it returns nothing, which happens when several renders run at once.
- `scripts/measure.mjs` measures words that start with dashes after a bare `--`.

The rules, `SKILL.md` and `references/drawio.md`:

- Grids for the decision ladder, the tree's hanging columns, the sequence's pins and its compact form, two-row state
  bands, the compact layered stack, an outline box inside a band, and data-model entities sized from their longest
  field.
- New patterns: an event from any state as one arrow with a dot; alternatives as pills on one card; a side step that
  leads back; failure endings and nested processes in swimlanes; a shared store as a band; spokes that talk to each
  other; side-by-side top-level boxes that keep their own heights; descriptive rows, opt-in options and family headers
  in a comparison matrix; pillars that wrap, with row labels; a retry with no limit; each branch's fate in a tree;
  relation notation in a data model.
- A split flow shares one density and hands over through a grey dashed card; two pictures that answer two questions
  each keep their own.
- Rules that contradicted each other now agree: the loop and the failure trunk under stage columns, the compact band
  name's width, the gap between neighbouring bands, the chip threshold, the ladder's spacing, the width of header
  cells, the shortest arrow.
- A loop runs along the band it returns to, and a failure ending stays in the band of the actor who stops the flow.
- Logos: where each comes from (LobeHub for the cloud companies, since Simple Icons has no AWS, Azure, Microsoft,
  Oracle or IBM), draw.io styles for Google Cloud Storage and Azure Blob, and the Kubernetes resource names that draw.

The skill's folder:

- `README.md`, the showcase, with its pictures and their `.drawio` sources in `showcase/`.
- Five evaluation cases for the new patterns.

### First release

- Fifteen compositions and two densities in Apple's system look, Instrument Sans, one `.drawio` file for both themes.
- `scripts/render.mjs` finishes, checks and previews the picture; `scripts/icon.mjs` fetches Lucide, LobeHub and
  Simple Icons marks; `scripts/measure.mjs` measures words in the real font.
- Installs with `npx skills add exdsgift/shuji-skills --skill bento-diagrams`, or as a Claude Code plugin.
