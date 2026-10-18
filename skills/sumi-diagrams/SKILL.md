---
name: sumi-diagrams
description: Writes diagrams and charts in Mermaid syntax and renders them with Pele, the fast Mermaid renderer behind Obsidian, as one SVG that follows the light and dark theme, or as a Mermaid block checked for an Obsidian note or a GitHub pull request, after checking syntax, overlaps and size. Picks among all 32 Pele types (flowchart, sequence, state, class, ER, C4, architecture, swimlane, gantt, timeline, git graph, mindmap, pie, XY, sankey, quadrant, radar, wardley and more) by the question asked, in a minimal grey look with one accent. Use it whenever someone asks to draw, diagram or visualize something from code, docs or numbers, a Mermaid diagram, a diagram or chart for a README, a pull request, a report, a doc or a note, an architecture, flow, sequence, state machine, schema, plan or data chart drawn as text, or to fix or restyle existing Mermaid, even if they name no tool. Not for draw.io files or hand-laid presentation figures.
---

# Sumi diagrams

A diagram here is Mermaid text rendered by [Pele](https://pele.run), drawn for engineers: grey boxes and lines, plain
words, and one orange accent on the arrowheads, so the eye follows the flow. Charts colour their series with the
Okabe-Ito colours. The source is always the Mermaid text; everything else is made from it by `scripts/render.mjs`.

The target is in [samples/](samples/): each `.mmd` beside a picture of its light and dark theme (the
`pull-request-` ones as GitHub draws them). Look at the one closest to the request before you write.

## Process

1. **Find the destination**, then the deliverable (table below). Done when you know where the reader will see it.
2. **Gather the facts.** Every node and edge comes from the request, the code or the docs you were given. When a
   missing fact would change the picture (a step's order, who owns a step, a cardinality), ask; for a detail that
   would not, choose and say so in your reply.
3. **Choose the type** by the question the diagram answers, then read its family's reference. Done when you can say
   the question in one sentence; two questions make two diagrams.
4. **Write the source** as `name.mmd` (or the block in the note), following the look and the words below.
5. **Check it:** `node scripts/render.mjs name.mmd --destination svg|readme|note|pr` (a Markdown note:
   `node scripts/render.mjs note.md`). Fix every problem it lists and run it again. Done when it prints
   `check: clean`. The first run installs Pele 1.6.0 from npm; without network, deliver the source and say it was not
   checked.
6. **Look at both previews** the script lists (light and dark). Fix what the check cannot see: a crowded corner, a
   label far from its edge, an order that reads backwards. Without a browser it says so: then open the SVG yourself.
7. **Deliver** the files with a one-line caption and the alt text (the `accTitle`).
8. **Offer pull request diagrams, once per repository.** After the first diagram you deliver in a Git repository on
   GitHub, look for `sumi-diagrams:` in its agent instructions (`AGENTS.md`, `CLAUDE.md`, or the file it uses). When
   it is not there, ask one question: should its pull requests get a diagram when they change something worth seeing,
   by a short rule written into that file (or into a new `AGENTS.md` when it has none)? Yes adds
   [the repository rule](references/pull-requests.md#the-repository-rule); no adds
   `<!-- sumi-diagrams: no pull request diagrams -->` to the file, if there is one. Write nothing before the answer.

## Destinations

| Where the reader sees it | Deliver | Run with |
| --- | --- | --- |
| An Obsidian note, or any host that renders Mermaid with Pele | the ` ```mermaid ` block, in the note | `render.mjs note.md` |
| A README on GitHub or GitLab | `name-light.svg`, `name-dark.svg`, the `<picture>` it prints, and `name.mmd` beside them | `--destination readme` |
| A pull request on GitHub | the ` ```mermaid ` block in its description, the change marked as [pull-requests](references/pull-requests.md) says | `--destination pr` |
| A docs site, a wiki, a slide, a chat, or anywhere unknown | `name.svg` (one file for both themes) and `name.mmd` | `--destination svg` (default) |

GitHub draws Mermaid blocks with Mermaid.js 12.1, which reads the same syntax as Pele but lays it out its own way, in
its own theme. A README gets the SVG pair, which keeps this look and follows the theme the reader chose on GitHub. A
pull request gets the block, which needs no file: read [pull-requests](references/pull-requests.md) first, for when a
change deserves a diagram, which type, and how to mark the change.

## Choose the type

| The question | Type | Keyword | Reference |
| --- | --- | --- | --- |
| What are the steps and decisions? What calls what? | Flowchart | `flowchart LR/TD` | [processes](references/processes.md) |
| Who does what, when hand-offs matter? | Swimlane | `swimlane-beta` | [processes](references/processes.md) |
| How do AI agents, tools and references pass work? | Agentflow | `agentflow-beta` | [processes](references/processes.md) |
| How does each step of a task feel? | User journey | `journey` | [processes](references/processes.md) |
| Who sends which message, in time order? | Sequence | `sequenceDiagram` | [interactions](references/interactions.md) |
| What states can it be in, and which events move it? | State | `stateDiagram-v2` | [interactions](references/interactions.md) |
| Which actors reach which goals with a system? | Use case | `usecase-beta` | [interactions](references/interactions.md) |
| How do commands, events and views change over time? | Event modeling | `eventmodeling` | [interactions](references/interactions.md) |
| Which types exist and how do they relate? | Class | `classDiagram` | [structure](references/structure.md) |
| What does the database hold? | ER | `erDiagram` | [structure](references/structure.md) |
| What is the system, at one zoom level? | C4 | `C4Context`, `C4Container`… | [structure](references/structure.md) |
| Which services connect, drawn as icons? | Architecture | `architecture-beta` | [structure](references/structure.md) |
| What sits where on a grid you arrange? | Block | `block` | [structure](references/structure.md) |
| Which requirements, and what satisfies them? | Requirement | `requirementDiagram` | [structure](references/structure.md) |
| Which fields does a header hold, bit by bit? | Packet | `packet` | [structure](references/structure.md) |
| What are the parts of a topic? | Mindmap | `mindmap` | [hierarchies](references/hierarchies.md) |
| How do files and folders nest? | Tree view | `treeView-beta` | [hierarchies](references/hierarchies.md) |
| How does a total divide, sized by value? | Treemap | `treemap-beta` | [hierarchies](references/hierarchies.md) |
| What causes one problem? | Ishikawa | `ishikawa-beta` | [hierarchies](references/hierarchies.md) |
| When does each task run, and what waits on what? | Gantt | `gantt` | [time](references/time.md) |
| What happened when? | Timeline | `timeline` | [time](references/time.md) |
| How do branches and merges relate? | Git graph | `gitGraph` | [time](references/time.md) |
| Where does each work item stand? | Kanban | `kanban` | [time](references/time.md) |
| How does one whole split into a few parts? | Pie | `pie` | [charts](references/charts.md) |
| How does a value change, or how do categories compare? | XY chart | `xychart` | [charts](references/charts.md) |
| Where do items sit on two judgements? | Quadrant | `quadrantChart` | [charts](references/charts.md) |
| How do a few options compare on several criteria? | Radar | `radar-beta` | [charts](references/charts.md) |
| How does a quantity flow and split? | Sankey | `sankey` | [charts](references/charts.md) |
| How do a few sets overlap? | Venn | `venn-beta` | [charts](references/charts.md) |
| How evolved is each part of a value chain? | Wardley map | `wardley-beta` | [strategy](references/strategy.md) |
| Which domain is each situation in? | Cynefin | `cynefin-beta` | [strategy](references/strategy.md) |
| What is the syntax of a language? | Railroad | `railroad-ebnf-beta`… | [strategy](references/strategy.md) |

When two fit, take the one whose question is closer to the request: a release process with three teams is a
swimlane, not a flowchart; a roadmap is a gantt, not a flowchart; "where does each thing run" is C4 or a flowchart
with one subgraph per runtime. A diagram that would need more than about 15 nodes answers more than one question:
split it.

## The look

The theme is fixed and lives in [assets/theme.css](assets/theme.css); `render.mjs` embeds it. Your part:

- Set no colours. A `classDef`, `style` or `linkStyle` with a colour stays that colour in both themes, so the dark
  theme breaks; the script reports them. A pull request is the one exception: it uses two classes of its own.
- Mark at most one node `:::key`, the one the diagram is about (the service a change touches, the failing step): it
  gets an outline in the accent. In a tree view the same mark is `:::highlight`. Mark `:::ext` what is outside the system, optional or not built yet: it gets a
  dashed outline. Nothing else carries emphasis.
- Charts: a chart with one series wears the accent, like everything else in the theme; the script sees to it. From
  two series on, they take the Okabe-Ito colours in a fixed order (blue, green, vermillion, pink, orange, sky,
  yellow). Name every series so it has a legend entry, keep to six, one measure per chart. Details in
  [charts](references/charts.md).
- Direction: `LR` for a chain of up to about eight steps, `TD` for anything longer or tree-shaped. The script reports
  a picture whose text would shrink below 11 px at its destination.
- Pele lays a graph out in source order. When the script reports crossing edges, declare the main path first and the
  edges that go back last, or flip the direction; keep the layout with the fewest crossings.

## Words

- **Facts, not inventions.** No node, edge, field or number that the request, the code or the docs do not support.
- **Short labels with real names:** a box says what it is (`Order service`, `orders-api`), an edge says what moves
  or happens (`POST /orders`, `publishes`, `on timeout`). Longer explanations go in the caption.
- **Accessible:** every source has `accTitle:` and `accDescr:` after its first line. Mindmap, venn, block, sankey
  and event modeling cannot hold them: write `%% accTitle: …` and `%% accDescr: …` instead, and the script adds them
  to the SVG. C4 takes its title from `title` and needs `accDescr`.
- **One question per diagram;** the caption says the answer in a sentence.
- **No signature:** nothing like "generated with" in the diagram, the file name, the caption or the alt text.

## Gotchas

Pele 1.6.0 rejects or misreads these, and most fail exactly as in Mermaid:

- A label with `( ) [ ] { } | @` must be quoted: `a["fn(x)"]`, `a -->|"retry (3x)"| b`. `:` `#` `;` are fine.
- A `<Word>` in a flowchart, state, ER, gantt or class-relation label (`List<Order>`) is read as an HTML tag and
  vanishes: write `List#lt;Order#gt;`. `a < b` with spaces is fine.
- These words cannot be node ids: `end`, `call`, `click`, `style`, `class`, `classDef`, `subgraph`, `graph`,
  `flowchart`, `linkStyle`, `href`, `interpolate`. Use `End`, `booking`, and so on. A `%%` comment needs a line of
  its own.
- `A---oB` is an edge with a circle end into `B`, and `A---xB` a cross: write `A --- oB` if `oB` is a node.
- `style zz …` on an id nothing uses draws an empty node. `class Repo<T>` fails: generics are `Repo~T~`.
- ER: every attribute needs a type; a relation label with spaces needs quotes (`: "settled by"`).
- Sequence: a `;` in a message ends the line; a `Note` needs `over A,B:` and the text.
- Gantt: a date that does not match `dateFormat` draws the task nowhere, without an error. Timeline: a period cannot
  hold a colon; write `09#58;12` for 09:12.
- Mindmap: mixed indentation re-parents nodes without an error.
- A label containing `C4Container`, `C4Component`, `C4Dynamic` or `C4Deployment` makes Pele read the whole text as
  C4: reword it.
- Sankey names are plain ASCII. Chinese and Japanese labels do not wrap: add spaces or shorten them.
- Architecture has five icons: `cloud`, `database`, `disk`, `internet`, `server`. Others draw empty squares.
- Treemap: one root paints the whole map in one colour; make the groups top-level.
- Quadrant points are between 0 and 1. In a requirement, `type: test` fails (`test` is a keyword): quote values.
- Pele ignores Mermaid themes, `themeVariables`, `look` and `layout: elk`: never add them.

## Checklist

```
- [ ] The type answers the question the request asks, one question per diagram
- [ ] Every node, edge and number comes from the request or the material given
- [ ] accTitle and accDescr are present (or their %% form)
- [ ] No colour set by hand; at most one :::key; :::ext only for what is outside or optional
- [ ] render.mjs printed "check: clean" for the right destination
- [ ] Both previews looked at: nothing crowded, nothing reads backwards
- [ ] Delivered what the destination needs, with a caption and the alt text
```

## Files

- [references/](references/): one file per family, with a verified example for every type, its syntax and Pele's
  quirks. Read the one the type table points to before writing; [pull-requests](references/pull-requests.md) for a
  diagram in a pull request.
- [scripts/render.mjs](scripts/render.mjs): renders, themes, checks and previews; `--now YYYY-MM-DD` fixes a Gantt's
  today line, `--transparent` drops the background, `--no-preview` skips the browser. Needs Node 20 or later; uses
  Chrome, Edge or Chromium when it finds one (`CHROME` points at one, `PELE` at another Pele build, `MERMAID` at
  another mermaid.min.js for pull request previews).
- [samples/](samples/): reviewed results, source and picture.

## When the skill is at fault

When something fails because of this skill, not because of the request, the project or the machine, offer to report it
where the skill is kept. A fault of the skill is a script that crashes or rejects valid input, a check that passes
what a rule here forbids, two instructions or an instruction and a sample that disagree, or a rule followed to the
letter that gives a wrong result. A missing Node, browser or network, a fact the request lacks, or a slip of yours
that a second try fixes is not one.

1. Finish the user's task, or set it aside, first: the report never replaces it.
2. Look for the same report: `gh issue list --repo exdsgift/shuji-skills --state all --search "<words of the error>"`.
   When one exists, offer a comment with what is new instead of a new issue.
3. Draft it: the title `sumi-diagrams: <what fails, in a few words>`, and a body with what you ran, what happened (the
   error text), what you expected and the rule or file here that says so, the agent and system, and a diff when you
   know the cause. Leave the user's work out: no path outside the skill, and no code, names, numbers or diagram text
   from their project. Describe the input in general words ("a flowchart with a quoted label holding a colon") or
   write a minimal one of your own.
4. Show the draft and ask once: "This looks like a defect in sumi-diagrams. Open this issue on
   github.com/exdsgift/shuji-skills?" Post nothing before a yes. A no ends it, and you do not ask again about the same
   fault.
5. On a yes, run `gh issue create --repo exdsgift/shuji-skills --title "<title>" --body-file -` with the draft and
   give the link. Without `gh`, or signed out, give the user
   `https://github.com/exdsgift/shuji-skills/issues/new?template=skill-defect.yml&skill=sumi-diagrams` to open, with
   the draft to paste.
