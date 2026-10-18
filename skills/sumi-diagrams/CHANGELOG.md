# Changelog

What changed in sumi-diagrams, newest first. There are no version numbers: each push to `main` is a release, and
`npx skills update` or `claude plugin update shuji@shuji` brings it.

## 2026-10-18

### Reporting a defect

- When something fails because of the skill itself, the agent offers to report it on exdsgift/shuji-skills: it
  drafts an issue without your code or your words, shows it to you, and opens it only after you say yes, with `gh` or
  through a link to the issue form.

### One Claude Code plugin

- In Claude Code the skill now comes in the `shuji` plugin, with every other shuji skill, and runs as
  `/shuji:sumi-diagrams`. If you installed `sumi-diagrams@shuji`, run
  `claude plugin install shuji --marketplace exdsgift/shuji-skills` once to move to it. `npx skills` installs are
  unchanged.

### Diagrams in pull requests

- A new destination, `--destination pr`, for a Mermaid block in a pull request's description. GitHub draws it with
  Mermaid.js 12.1.0, the syntax Pele reads, so the script checks it with Pele, then draws it with that Mermaid.js in
  GitHub's light and dark theme for a preview. Mermaid.js is fetched once from jsDelivr, about 5 MB, and checked
  against its SHA-256.
- `references/pull-requests.md` says when a change deserves a diagram and which one: a flowchart for who calls whom,
  a sequence for a new exchange, a state, ER or class diagram for states, schema and types, a git graph for a
  backport or a stack, bars for numbers before and after. A fix inside one function, a dependency bump or a config
  change gets none.
- The change is marked in a way both GitHub themes read: `:::changed` outlines what the pull request adds or changes
  in orange, `:::removed` dashes what it deletes, and new messages in a sequence sit in a translucent orange `rect`.
  The script rejects `:::key` and `:::ext`, which GitHub cannot draw, any other class, any fill, and a diagram of more
  than 15 nodes.
- After the first diagram in a repository on GitHub, the skill asks once whether its pull requests should get one. A
  yes writes a short rule into `AGENTS.md`, or the instructions file the repository uses, so any agent writing a pull
  request draws it from what it has already gathered; a no writes a one-line marker, so no agent asks again.
- `samples/` adds two pull request results, a flowchart and a sequence, pictured as GitHub draws them; the README
  shows the flowchart as a live block, drawn by GitHub.
- The script no longer warns that GitHub may not draw the new Mermaid types: GitHub draws them with Mermaid.js 12.1,
  in its own look. A README still gets the SVG pair, which keeps this one.
- `--out` creates its folder when it does not exist, instead of stopping with an error.

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
