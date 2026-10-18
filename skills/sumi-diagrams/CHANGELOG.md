# Changelog

What changed in sumi-diagrams, newest first. There are no version numbers: each push to `main` is a release, and
`npx skills update` or `claude plugin update sumi-diagrams@shuji` brings it.

## 2026-10-18

### First release

- Writes diagrams and charts as Mermaid text and renders them with Pele 1.6.0, installed from npm on the first run.
- Covers all 32 types Pele draws, chosen by the question a diagram answers, with one reference per family
  (processes, interactions, structure, hierarchies, time, charts, strategy and grammar) and a verified example for
  every type.
- Delivers by destination: one SVG that follows the light and dark theme, a light and dark pair with the
  `<picture>` for a README on GitHub or GitLab, or a checked block for an Obsidian note.
- One theme: grey boxes and lines, muted words on the edges, an orange accent on the arrowheads, `:::key` for the one
  node a diagram is about and `:::ext` for what is outside it. Chart series wear the Okabe-Ito colours, ordered so
  neighbours stay apart under colour blindness; a chart with a single series wears the accent instead, so the
  theme keeps one colour. Agentflow kinds and timeline sections stay grey; Gantt bars are
  neutral, with the accent on critical tasks and the today line.
- `scripts/render.mjs` checks what Pele and Mermaid let through without an error:
  - a style on a missing node, more than one key node, hand-set colours, a missing title and description;
  - a Gantt date that misses `dateFormat`, a colon in a timeline's period, a `<Word>` read as a tag and dropped;
  - every known parse mistake at once: reserved words as node ids, unquoted brackets in labels, comments after code.
- It also finds edges through nodes, overlapping labels, crossing edges and pictures too wide for their destination,
  measures the words in a real font, writes previews of both themes when a browser is available, and puts the
  title and description into the SVG of the types that cannot hold them.
- `samples/` holds seventeen reviewed results from two evaluation rounds, each source beside its light and dark
  picture.
