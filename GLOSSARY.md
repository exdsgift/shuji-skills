# shuji

Skills that coding agents load to make things for people, such as diagrams, or to run a process for them, such as a
delivery loop. These terms name what the skills hand over, where it goes, and who does what in the loop.

## Language

**Destination**:
The place where a reader will meet the diagram: an Obsidian note, a README on GitHub, a pull request, a documentation
site, a slide, or a file the user asked for.
_Avoid_: target, output location

**Host renderer**:
The program that draws a Mermaid block at the destination, such as Pele in Obsidian or Mermaid.js on GitHub.
_Avoid_: viewer, engine

**Pull request diagram**:
A diagram of what a pull request changes, kept as a Mermaid block in its description and drawn by GitHub. Only a
change a reviewer would otherwise picture from the diff gets one.
_Avoid_: PR chart, change diagram

**Source**:
The Mermaid text of a diagram, kept as a `.mmd` file or a fenced block. The one thing edited by hand; everything else
is made from it.
_Avoid_: code, definition

## Colour

**Accent**:
The one colour of the theme: the arrowheads and the key node of a diagram, the series of a chart that has only one,
and the changed parts of a pull request diagram. Everything else is grey.
_Avoid_: brand colour, highlight colour, primary

**Key node**:
The one node a diagram is about, outlined in the accent. A diagram has at most one.
_Avoid_: highlighted node, primary node

**Changed part**:
What a pull request adds or changes, outlined in the accent in a pull request diagram; what it deletes is dashed.
_Avoid_: diff highlight, new node

**External node**:
A node outside the system being drawn, or optional, or not built yet, drawn with a dashed outline.
_Avoid_: ghost node, third-party box

**Series colours**:
The Okabe-Ito colours in one fixed order, worn by the series of a chart that has two or more; the first series
always takes the first colour.
_Avoid_: categorical palette, chart theme, rainbow

## Delivery loop

**Master**:
The session that runs the loop: it picks tickets, writes briefs, decides, lands pull requests and keeps the issues
current. It never writes the change itself.
_Avoid_: orchestrator, lead agent, coordinator

**Executor**:
The subagent that builds one ticket in its own worktree and stops at the push. The executor-light builds mechanical
tickets on a cheaper model.
_Avoid_: worker, implementer, coder

**Reviewer**:
The subagent that reviews one pull request or plan, in a fresh context, read-only, on a model other than the
executor's.
_Avoid_: checker, critic, judge

**At the push**:
The moment the executor stops: its draft pull request is open and its local checks pass; CI and the review are
the master's.
_Avoid_: when done, at completion

**Track**:
How much process a ticket gets, decided before it starts: A full, B light, C mechanical.
_Avoid_: lane, tier, size

**Mode**:
How far the master goes without the operator: autonomous, finish and stop, or one ticket.
_Avoid_: autonomy level, run mode

**Queue**:
The ordered table of tickets in the map issue, the one place the order lives.
_Avoid_: backlog, board, roadmap

**Proof**:
What makes a review finding bug-level: a test that fails, a red check, or a concrete input and its wrong output.
Without one, a finding is a nit.
_Avoid_: evidence, justification

**Setup file**:
The file in each repository that holds its values for the loop, `docs/agents/toryo-loop.md`.
_Avoid_: config, settings
