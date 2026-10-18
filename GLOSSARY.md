# shuji

Skills that coding agents load to make things for people, chiefly diagrams. These terms name what the skills hand
over and where it goes.

## Language

**Destination**:
The place where a reader will meet the diagram: an Obsidian note, a README on GitHub, a documentation site, a slide,
or a file the user asked for.
_Avoid_: target, output location

**Host renderer**:
The program that draws a Mermaid block at the destination, such as Pele in Obsidian or Mermaid.js on GitHub.
_Avoid_: viewer, engine

**Source**:
The Mermaid text of a diagram, kept as a `.mmd` file or a fenced block. The one thing edited by hand; everything else
is made from it.
_Avoid_: code, definition

## Colour

**Accent**:
The one colour a diagram carries, on its arrowheads only; everything else in a diagram is grey.
_Avoid_: brand colour, highlight colour, primary

**Key node**:
The one node a diagram is about, outlined in the accent. A diagram has at most one.
_Avoid_: highlighted node, primary node

**External node**:
A node outside the system being drawn, or optional, or not built yet, drawn with a dashed outline.
_Avoid_: ghost node, third-party box

**Series colours**:
The Okabe-Ito colours in one fixed order, worn by the series of a chart; the first series always takes the first
colour.
_Avoid_: categorical palette, chart theme, rainbow
