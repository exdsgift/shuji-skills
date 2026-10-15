# The bento style in draw.io

Read this before writing draw.io XML for a bento diagram. It gives the parts every picture shares, then the grid of
each composition, then the two scripts that fetch icons and render, check and preview the picture.

Contents: [The model](#the-model) · [Shared parts](#shared-parts) · [Arrows](#arrows) · [Compositions](#compositions)
· [Measure](#measure) · [Icons](#icons) · [Render and check](#render-and-check) · [Edit in place](#edit-in-place) ·
[Gotchas](#gotchas)

## The model

Set `adaptiveColors="auto"` on `mxGraphModel` and write every colour as `light-dark(LIGHT,DARK)`, including one that
is the same in both themes, because draw.io inverts a plain hex for the dark theme on its own.

```xml
<mxfile><diagram id="d" name="Release flow"><mxGraphModel adaptiveColors="auto">
  <root><mxCell id="0"/><mxCell id="1" parent="0"/> ... </root>
</mxGraphModel></diagram></mxfile>
```

Every cell that carries text starts from this base, with its part's style after it (when a key repeats, the last one
wins):

```
html=0;fontFamily=Instrument Sans;fontSource=https%3A%2F%2Ffonts.googleapis.com%2Fcss2%3Ffamily%3DInstrument%2BSans%3Awght%40400%3B600;
```

`html=0` keeps each label plain SVG text, which every viewer shows. Plain text does not wrap: each line of a card is
a cell of its own, and a two-line label (a diamond's question) uses `&#xa;` in its value. For code, a path or a field,
use `fontFamily=IBM Plex Mono` with `fontSource=https%3A%2F%2Ffonts.googleapis.com%2Fcss2%3Ffamily%3DIBM%2BPlex%2BMono%3Awght%40400`.
Put every cell under `parent="1"` with absolute coordinates; the overlap check reads them that way.

A picture this size is best written by a short script that places the cells from a list: a card is seven cells and
an icon is a long base64 string. Once the picture is reviewed, the `.drawio` file is the source.

## Shared parts

Append each style to the text base when the cell has words. With `absoluteArcSize=1`, draw.io reads `arcSize` as the
corner's diameter: 26 draws a 13 px corner.

### Page and header

```
background: rounded=0;fillColor=light-dark(#FFFFFF,#000000);strokeColor=none;
eyebrow:    text;fillColor=none;strokeColor=none;align=left;verticalAlign=middle;fontSize=13;fontStyle=1;fontColor=light-dark(#007AFF,#0A84FF);
title:      text;fillColor=none;strokeColor=none;align=left;verticalAlign=middle;fontSize=30;fontStyle=1;fontColor=light-dark(#1D1D1F,#FFFFFF);
subtitle:   text;fillColor=none;strokeColor=none;align=left;verticalAlign=middle;fontSize=16;fontColor=light-dark(#6E6E73,#98989F);
```

The eyebrow sits at (20, 18), 22 high; the title at (20, 40), 44 high; the subtitle at (20, 86), 30 high. The picture
starts at y 138. The background is drawn first and reaches 40 beyond every other cell: from (left - 40, -20) to
(right + 40, bottom + 40), where left, right and bottom are the outermost edges of the other cells.

### Compartment

A lane, a column, a region or a layer: one grey box, its name in small capitals after a glyph in its colour.

```
box:      rounded=1;absoluteArcSize=1;arcSize=36;fillColor=light-dark(#F2F2F7,#1C1C1E);strokeColor=none;
name:     text;fillColor=none;strokeColor=none;align=left;verticalAlign=middle;fontSize=12;fontStyle=1;fontColor=light-dark(#6E6E73,#98989F);
hairline: fillColor=light-dark(#E5E5EA,#3A3A3C);strokeColor=none;
```

Draw the glyph in the light variant of the compartment's colour (`node scripts/icon.mjs lucide:<name> #007AFF`): an
image cannot follow the theme, and the light variants read on both the light and the dark grey. Two layouts exist:

- A band (swimlanes, layers, a roadmap's workstreams) has a header column: the glyph 28 x 28 at x + 22, the name 8
  below it at x + 22, 120 x 20 (two lines, 36 high, when it has more than about 15 characters), the two together
  centred on the band's height, and a hairline 1 wide at (x + 150, y + 16) as tall as the band less 32. Its cards
  start at x + 171.
- A box (columns, regions, containers) has a header row: the glyph 20 x 20 at (x + 20, y + 18), the name at
  (x + 48, y + 16), 24 high. Its content starts at y + 56, with 24 of padding on the sides and at the bottom.

### Card

```
card:   rounded=1;absoluteArcSize=1;arcSize=26;fillColor=light-dark(#FFFFFF,#2C2C2E);strokeColor=none;shadow=1;
tile:   rounded=1;absoluteArcSize=1;arcSize=16;fillColor=light-dark(<light>,<dark>);strokeColor=none;
glyph:  the output of scripts/icon.mjs, white
title:  text;fillColor=none;strokeColor=none;align=left;verticalAlign=middle;fontSize=15;fontStyle=1;fontColor=light-dark(#1D1D1F,#FFFFFF);
line:   text;fillColor=none;strokeColor=none;align=left;verticalAlign=middle;fontSize=13;fontColor=light-dark(#6E6E73,#98989F);
```

| Cell | Standard card, 178 x 120, at (x, y) | Compact card, 216 x 64 |
| --- | --- | --- |
| tile | (x + 14, y + 12), 32 x 32 | (x + 12, y + 16), 32 x 32 |
| glyph | (x + 20, y + 18), 20 x 20 | (x + 18, y + 22), 20 x 20 |
| title | (x + 14, y + 50), 160 x 20 | (x + 54, y + 12), 150 x 20, size 14 |
| lines | (x + 14, y + 71) and (x + 14, y + 88), 160 x 17 | one at (x + 54, y + 33), 150 x 17, size 12 |

The compact card is the card of the compact density, and in the regular density it serves the dense compositions (a
mind map, a hub's spokes, a tree with many leaves). One picture uses one size, except that the centre of a hub or a
mind map may be a standard card among compact ones. A mono line uses
`fontFamily=IBM Plex Mono` at 12. Cards carry no number.

`shadow=1` is enough: render.mjs adds the soft shadow's keys to the model.

An outline replaces `strokeColor=none;shadow=1;` on the card:

| Kind | Outline |
| --- | --- |
| outcome | `strokeColor=light-dark(#34C759,#30D158);strokeWidth=2;shadow=0;` |
| stop or failure | `strokeColor=light-dark(#FF3B30,#FF453A);strokeWidth=2;shadow=0;` |
| a flow of its own | `strokeColor=light-dark(#AEAEB2,#8E8E93);strokeWidth=2;dashed=1;shadow=0;` and a grey tile |
| an option still open, or an optional part (an operator's install) | `strokeColor=light-dark(#FF9500,#FF9F0A);strokeWidth=2;dashed=1;shadow=0;` |
| in progress | `strokeColor=light-dark(#007AFF,#0A84FF);strokeWidth=2;shadow=0;` |

A product's tile is tinted instead of solid: `fillColor=light-dark(#BRAND,#BRAND);fillOpacity=13;`, with the logo in
the glyph's place. Two kinds of mark need a chip instead, with no opacity:

- A dark mark (black, navy, or any brand colour darker than mid-grey, such as PostgreSQL's `#4169E1` or Kafka's
  near-black) disappears on the dark card: `fillColor=light-dark(<the 13 % tint mixed by hand>,#D1D1D6);`, each
  channel `255 - 0.13 x (255 - brand)`, which is `#DEDEDE` for black.
- A pale mark (yellow, light cyan, such as ClickHouse's `#FFCC01`) fades on the white card:
  `fillColor=light-dark(#2C2C2E,<the 13 % tint on dark>);`, so it reads as the product's own dark badge. The tint on
  dark mixes each channel as `44 + 0.13 x (brand - 44)`.

A brand colour inside a logo carries no meaning in the legend, even when it is yellow, red or green. Measured against
the card, a mark needs a chip when its contrast is below about 2:1: a dark mark whose lightness is under 35 % (Stripe's
`#635BFF` is borderline, PayPal's navy and PostgreSQL's `#4169E1` need it), a pale one whose lightness is over 80 %. A
wordmark (Adyen, a name written out) is unreadable at 20 px: let it fill the tile at 28 x 28.

### Compact density

Every measure in this file is the regular density. The compact density keeps the language and shrinks the grid, for
a picture with many cards or one that goes on a slide or a document page. Only these values change:

| Part | Compact |
| --- | --- |
| header | eyebrow 12/600 at y 14, title 24/600 at y 32 (34 high), subtitle 14 at y 68 (22 high); the picture starts at y 112 |
| card | 216 x 64: tile 32 at (x + 12, y + 16), glyph 20 at (x + 18, y + 22); title 14/600 at (x + 54, y + 12), 150 x 20; one line, 12 muted or mono 11, at (x + 54, y + 33), 150 x 17 |
| band | 104 high, 8 apart; header column 120 wide (glyph 20 at x + 20, name 11/600 under it in a cell 96 x 20, hairline at x + 120); cards at x + 136 and band y + 20, columns 240 apart |
| box | header row 40 high (glyph 18 at x + 16, y + 12; name 11/600 at x + 40), content at y + 40, padding 12, siblings 12 apart; cards stacked 76 apart, or 120 when a labelled arrow runs between them |
| stage columns | 240 wide, 40 apart; the failure trunk 24 below the columns, its endings 84 below them |
| nested containers | card columns 240 apart through every level |
| decision | 120 x 80 at card y - 8, the question 13/600 on two lines; its labelled answers leave by its sides into a free column, since 40 between bands holds no label |
| loop back | 6 below the first band's top |
| roadmap | month columns 120 wide; bars 36 high (title 12/600, line 11), rows 44 apart; band padding 16; milestone 12 |
| arrows | 1.5 px, `endSize=5`; labels 11 |
| caption, legend | caption 13; legend words 12 (width from `measure.mjs --size 12`, plus 4), samples 28 x 18 |

A card has one line, so keep the essential words: the compartment already names what the title would repeat. Gaps of
24 between cards and 40 between columns hold no label: put labels where an arrow changes band or crosses a free
column, and drop a label that only says the flow goes on ("passes").

### Decision

```
rhombus;fillColor=light-dark(#FFFFFF,#2C2C2E);strokeColor=light-dark(#FFCC00,#FFD60A);strokeWidth=2;fontSize=14;fontStyle=1;fontColor=light-dark(#1D1D1F,#FFFFFF);
```

160 x 112, centred where a card would be: at (card x + 9, card y + 4). The question is its own label, up to about 14
characters a line, two lines at most with `&#xa;`. A labelled answer needs a straight stretch, so
the card it leads to sits one column further on, or in another band, never in the next slot 31 px away.

### Caption and legend

```
caption: text;fillColor=none;strokeColor=none;align=left;verticalAlign=middle;fontSize=14;fontColor=light-dark(#6E6E73,#98989F);
words:   text;fillColor=none;strokeColor=none;align=left;verticalAlign=middle;fontSize=13;fontColor=light-dark(#6E6E73,#98989F);
```

The caption is one line, 24 below the picture: it cannot wrap, so it holds about one character per 7 px of the
picture's width (6 px at the compact 13); each further sentence goes in its own cell 22 below, three at most. The
legend is one row whose top is 24 below the caption's bottom: for each kind, a 34 x 22 sample, 8 px, its words, 28 px
to the next. Make each word cell as wide as its words plus 4, measured with `node scripts/measure.mjs "a step" "the
release is done"` (add `--size 12` at the compact density): a per-character estimate leaves the gaps uneven, since
Instrument Sans letters vary a lot in width. A card sample is `rounded=1;arcSize=30;fillColor=light-dark(#FFFFFF,#2C2C2E);`
with the kind's outline, or `strokeColor=light-dark(#D1D1D6,#3A3A3C)` for a plain card so it shows on white; a
decision is the rhombus; a line or a crow's foot is a free-standing arrow 34 long with the same style as in the
picture, except a dashed line, which is 40 long so its dashes end on a dash rather than a stub. A tile kind (a timer,
a colour shared by two groups) is a 22 x 22 tile flush left in the sample's place, with its words 8 after it.

## Arrows

```
edgeStyle=orthogonalEdgeStyle;rounded=1;arcSize=24;endArrow=block;endFill=1;endSize=6;strokeColor=light-dark(#AEAEB2,#8E8E93);strokeWidth=2;fontSize=12;fontColor=light-dark(#48484A,#D1D1D6);labelBackgroundColor=light-dark(#F2F2F7,#1C1C1E);
```

| Kind | Add |
| --- | --- |
| loop back | `strokeColor=light-dark(#FFCC00,#FFD60A);dashed=1;dashPattern=6 4;` |
| both ways | `startArrow=block;startFill=1;startSize=6;` |
| lifeline | `endArrow=none;dashed=1;dashPattern=4 4;` |
| connector with no direction | `endArrow=none;` |
| crow's feet | `startArrow=ERmandOne;endArrow=ERmany;startSize=10;endSize=10;startFill=0;endFill=0;` |
| on the page, not on a compartment | `labelBackgroundColor=light-dark(#FFFFFF,#000000);` |

- Pin every arrow with `exitX`, `exitY`, `entryX` and `entryY` (0 to 1 along the side), plus `exitDx=0;exitDy=0;` and
  the same for entry. Choose pins that land on whole pixels; a fraction tilts the segment.
- Add waypoints through the gaps so draw.io's router never crosses a card:

```xml
<mxCell id="e1" value="yes" style="..." edge="1" source="a" target="b" parent="1">
  <mxGeometry x="-0.6" relative="1" as="geometry">
    <Array as="points"><mxPoint x="680" y="146"/><mxPoint x="280" y="146"/></Array>
  </mxGeometry>
</mxCell>
```

- A label sits on its arrow; the render script sizes its background to the words plus 8 each side, so the line breaks
  cleanly around them. Its place is the geometry's `x`, from -1 at the source to 1 at the target: to centre it at
  distance d along a route of total length L, use `x = 2 x d / L - 1`. It needs a straight stretch at least its width
  plus 40, inside one compartment or wholly on the page.
- Several loops back share one line: draw the longest as the full loop, and each other one as a short stub with
  `endArrow=none` that joins it, so the dashes of two overlapping edges never fall out of step.
- Two arrows that merge share their last waypoints and their entry pin. A label on the shared stretch belongs to the
  arrow written last in the file, or the other line is painted over it.
- A free-standing line (a lifeline, a legend sample, a timeline's today) has no source or target: give its geometry
  `<mxPoint as="sourcePoint">` and `<mxPoint as="targetPoint">`.
- A line that is meant to cross cards (a roadmap's today, a gridline) carries `bento=guide;` in its style: the
  overlap check then lets it cross cards and compartments, but still reports it when it runs through text.
- Where two arrows must cross, add `jumpStyle=arc;jumpSize=10;` to the one written later.

## Compositions

Every composition uses the header, the compartments, the cards and the arrows above. Only the grid changes.

### Swimlanes

Bands 176 high at y = 138 + 188 i, 12 apart, from x 20, all as wide as the widest. Columns at card x = 191 + 200 k;
cards at band y + 28, decisions at band y + 32. Steps of one band in neighbouring columns are 22 apart, too close for
a label: a labelled arrow leaves the next column empty, or changes band and carries its label on the vertical stretch.
A loop back runs 8 below the top of the first band, above every card, and enters its step from the top; its label
goes on its vertical stretch.

### Stage columns

Columns 220 wide at x = 20 + 300 j, 80 apart, from y 138 to the bottom of the tallest. Each has a header row; its
cards are standard, at x + 21, the first at y + 56, then every 136 (16 apart). An arrow from one column to the next
leaves a card's right side and enters a card's left side; its label sits in the 80 between columns, on the page
colour, up to about 7 characters. Cards in one column join by short unlabelled arrows downward.

A check that can fail is a card, not a diamond: the next card follows it, and its failure leaves by the column's
bottom. The failures of several columns join one trunk 32 below the columns into a red outlined ending in a row 104
below them; the last column's own failure runs down its right side to an ending under it. Endings count toward the
size of the picture. A loop back (the next round) cannot run above the columns,
where their headers are: it runs under them, 24 below, and enters the column it returns to from below.

### Nested containers

The outermost container is a filled box with a header row. A container inside it is drawn as an outline only, so the
nesting stays readable:

```
rounded=1;absoluteArcSize=1;arcSize=28;fillColor=none;strokeColor=light-dark(#D1D1D6,#3A3A3C);strokeWidth=1.5;
```

with `dashed=1;dashPattern=6 4;` for a logical boundary (a subnet, a namespace) rather than a physical one. Each has a
header row, its content 56 below its top and at least 20 of padding; siblings are 24 apart. Keep the card columns
aligned through every level, on one grid 200 apart, and let the padding absorb the difference. Arrows between
containers cross their outlines at right angles and carry their labels inside a container.

- A global service (DNS, a CDN) sits in the outermost box, outside any region.
- Zones: when the zones matter, draw one dashed box per zone side by side inside the network, and put a resource that
  spans zones (a load balancer, a cluster, a replicated cache) in a band across the zones' tops or bottoms, never
  straddling two boxes. When they matter less, use one box per tier and three card columns, zone a, both, zone b, and
  say so in the caption.

### Hub and spoke

The hub is a standard card in the middle of a box that names the system's boundary. The spokes sit on a 3 x 3 grid
around it, 360 apart across and 220 down, the middle cell being the hub: up to eight spokes, on the left the systems
that send, on the right those that receive. Each spoke has one arrow to or from the hub, leaving the hub's nearest
side; the label sits on the stretch next to the spoke. More than eight neighbours: group them by kind into a box per
group (a compartment with its header row, named for the kind and coloured), its compact cards stacked 76 apart. The
group's arrows join one trunk 40 outside its box, labelled once on the stretch between the box and the hub, so keep at
least 160 between the boxes. The hub is a standard card in the regular density and may be compact in the compact one.

- A group whose arrows go both ways (our own systems: one calls in, another listens) is not a spoke: draw it as the
  box around the hub, its cards in a row above it, each with its own short labelled arrow.
- A group may sit above or below the hub as well as beside it; its trunk then runs vertically.
- A store that every stage writes to (a log, a trace store, metrics) sits under the picture: short drops from each
  stage join one trunk into it, labelled once ("logged for review").

### Tree and decision tree

The root is centred on top, at y 138. Each level is a row 216 below the last (a card plus 96); siblings are 200
apart, and 240 between two groups of cousins, so each family reads as one. A parent is centred over the middle of its
first and last child. A connector leaves the parent's bottom, drops 40 to a bar shared by all its children, and drops
again into each child's top: `endArrow=none` for an org chart or a breakdown, a head for a decision tree. A level of
more than about eight cards is too wide for a slide: hang each parent's children in a column under it instead, 76
apart as compact cards, joined by a spine on their left. A responsibility that is not a person (an on-call rotation)
is a line on the cards that carry it, not a card.

In a decision tree, the questions are diamonds and the answers are labels on each child's vertical stretch (56 long).
When every leaf is an answer, as in a classification, outline every leaf green and let its tile colour rank them;
when some leaves stop the procedure, outline those red. A chain where one answer always ends is a ladder, not a
staircase: the questions run down a spine at the left, one row each, and each ending sits to the right of its
question.

### Layered stack

Bands like swimlanes but 112 high with compact cards at y + 24, 12 apart, the top layer the one closest to the user
and the bottom the hardware or the platform. Arrows only for a dependency that skips a layer. A layer
whose cards are alternatives (one database or another) says so in its name.

### Sequence

One box around the exchange. Participants are standard cards in a row at box y + 56, 400 apart. From
each card's bottom a lifeline drops to the box's bottom less 24, drawn as dashed segments between the cards on it, so
no line crosses a card. Messages are horizontal arrows between lifelines, 56 apart down the page, each with a verb;
a message that passes a lifeline bridges it with `jumpStyle=arc`. A step a participant does on its own is a
card centred on its lifeline, with the messages entering and leaving its sides. The result is an outlined card on the
lifeline of the participant that holds it.

### Data model

Regions by domain, each a box. An entity is a card 248 wide: the tile at (x + 14, y + 14), the title at
(x + 56, y + 12), 178 x 20, one line at (x + 56, y + 33), 178 x 17, a hairline
(`line;strokeColor=light-dark(#E5E5EA,#3A3A3C);`) at y + 62, 220 wide, then one row per field from y + 72, 18 apart:
the name in mono 12 ink at x + 16, the type in mono 12 muted right-aligned to x + 232. Its height is 84 plus 18 per
field. Entities are 368 apart across and 48 apart down within a box, so a verb and two crow's feet fit between them.
No numbers.

### State machine

Bands for stages, on the swimlane grid; each state is a card whose second line is its status code in mono. Every
transition carries its event, so the grid's labelling rule matters most here: a state's next state in the same band
leaves a column free, or sits in the next band. The happy path reads left to right; endings are outlined.

### Roadmap

A row of month names in small capitals at y 138, 22 high, centred over columns 160 wide from x 191; the bands start at
y 172, one per workstream, with a header column. A piece of work is a bar 44 high, from its start to its end month (8
in from each boundary); work that overlaps in time takes another row in its band, 56 below, so a band is 68 plus 56
per row high (plus 24 when a milestone's name sits under its last row). Each month boundary has a gridline: a `line`
cell 1 wide, `line;direction=south;strokeWidth=1;strokeColor=light-dark(#E5E5EA,#3A3A3C);bento=guide;`, drawn only in the free
stretches, so it stops short of every bar and every word. A bar is:

```
bar:    rounded=1;absoluteArcSize=1;arcSize=20;fillColor=light-dark(<light>,<dark>);fillOpacity=18;strokeColor=none;
accent: rounded=1;absoluteArcSize=1;arcSize=4;fillColor=light-dark(<light>,<dark>);strokeColor=none;
```

with a 4 x 44 accent at its left in the workstream's colour, its title in 13/600 ink (about 7.6 px a character) at
x + 14, y + 6, and its dates or owner in 12 muted at x + 14, y + 24. A milestone is a 14 x 14 square rotated 45
degrees (`rotation=45`) in the workstream's colour, inside the bar's end, with its name in 12/600 ink under the bar,
right-aligned to the diamond. Today is a dashed blue `line` cell with `bento=guide`, at the day's place between two
boundaries, from the month row to the bottom, under a blue capsule `rounded=1;arcSize=50;fillColor=light-dark(#007AFF,#0A84FF);`
56 x 22 with "Today" in white 11/600. Work in progress may take the blue outline; done work drops to `fillOpacity=10`.
A product named on a bar stays in its words; bars carry no logos.

### Comparison matrix

Options are standard cards in a header row at y 138, 200 apart from x 191. Criteria are bands 88 high,
12 apart, starting 12 below the header cards, each with a header column. A cell is the verdict glyph on a 20 x 20 tile
(`arcSize=10`, glyph 14: green `check`, orange `minus`, red `x`) at (column x + 14, band y + 34) and two or three
words in 13 muted beside it at column x + 44. The last band is the verdict, 176 high: a standard card per option at
band y + 28, with the verdict tile as its tile, the chosen option outlined green, each with one line on why. The
legend shows each verdict tile beside its word.

### Mind map

The idea is a standard card in the middle, its tile blue. Up to three branches on each side are compact cards, each
with a tile in its own system colour; its leaves are compact cards with the same tile colour. Lay each branch out as a
block: its leaves stacked 76 apart, the branch centred on them, blocks 40 apart down the side. Leave 120 between the
idea and the branches and 80 between a branch and its leaves (edge to edge). Put the larger half of the branches on
the right; the left mirrors it. The connectors leave the idea from one point on each side, curved and in the branch's
colour, with no head:

```
edgeStyle=orthogonalEdgeStyle;curved=1;endArrow=none;strokeWidth=2;strokeColor=light-dark(<light>,<dark>);
```

from the idea's side to the branch, and from the branch to each leaf in the arrow grey. No legend unless a
colour means more than a branch.

### Pillars

One column per group, as in stage columns but 12 apart, since no arrow runs between them: each a box with its header
row, its cards stacked inside, all columns as tall as the tallest. No arrows. When every card is one
kind, the legend says only what the tile colour means ("an initiative, its tile in the colour of its pillar").

### Journey

Stages are columns as in stage columns, named for what the person is trying to do. Rows are bands for what they do,
what they touch and how they feel, with a header column on the left of the stage columns. A cell is a compact card;
a pain point is a compact card outlined red, a moment that delights outlined green. Arrows only along the "does" row.

## Measure

Averages for Instrument Sans, enough to plan a grid; for a cell whose width matters (a legend word, a label in a tight
gap), measure the words themselves with `node scripts/measure.mjs [--size N] [--bold] [--mono] "text" ...`.

| What | Per character | Fits |
| --- | --- | --- |
| card title, 15/600 | about 8.5 px | 18 characters in 160 |
| card line, 13/400 | about 7 px | 22 characters in 160 |
| compact title, 14/600 / line, 12/400 | about 8 / 6 px | 15 characters in 126 (18 in 150) / 24 in 150 |
| arrow label, 12/400 | about 6.5 px | its width plus 16 of background, plus 40 of straight line |
| compartment name, 12/600 capitals | about 8 px | 15 characters in 120 |
| mono, 12 | about 7.2 px | 22 characters in 160 |

## Icons

`node scripts/icon.mjs lucide:<name>` prints a cell style with the white glyph embedded; add a colour
(`lucide:server #007AFF`) for a compartment's glyph. `lobe:<slug>` and `si:<slug>` fetch a product's logo in its
colours. Find Lucide names at https://lucide.dev/icons; the script says so when a name does not exist.

draw.io's own libraries carry the cloud providers:

| Library | Style | Place |
| --- | --- | --- |
| AWS service | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.<service>;fillColor=light-dark(#C,#C);strokeColor=light-dark(#FFFFFF,#FFFFFF);aspect=fixed;` | in place of the tile, 32 x 32: the icon is its own coloured square |
| Kubernetes logo | `shape=mxgraph.gcp2.kubernetes_logo;fillColor=light-dark(#326CE5,#326CE5);strokeColor=none;aspect=fixed;` | 20 x 20 on a tinted tile |
| Kubernetes resource | `shape=mxgraph.kubernetes.icon2;prIcon=<pod, deploy, svc, pv, secret, job...>;fillColor=light-dark(#326CE5,#326CE5);strokeColor=light-dark(#FFFFFF,#FFFFFF);aspect=fixed;` | in place of the tile, 32 x 32 |

AWS service names that exist: `cloudfront`, `s3`, `application_load_balancer`, `nat_gateway`, `ecs`, `eks`, `fargate`,
`ec2` (also for an EKS node group), `lambda`, `rds`, `aurora`, `dynamodb`, `elasticache`, `sqs`, `sns`, `eventbridge`,
`step_functions`, `api_gateway`, `cognito`, `route_53`, `cloudwatch_2`, `secrets_manager`, `kinesis`, `redshift`,
`sagemaker`, `bedrock`. Their squares have sharp corners by design; keep them as they are. Their colours
follow the category: compute `#ED7100`, storage `#7AA116`, database `#C925D1`, networking and content delivery
`#8C4FFF`, application integration and management `#E7157B`, security `#DD344C`, analytics `#8C4FFF`, machine learning
`#01A88D`.

## Render and check

```bash
node scripts/render.mjs picture.drawio
```

The `.drawio` is the deliverable, so the script first finishes its model in place, and says so: every arrow label
with a background gets `overflow=fill` and a geometry as wide as its measured words plus 16 (draw.io otherwise sizes
the background from a fallback font, and the line runs into the first and last letters), and every `shadow=1` gets the
soft shadow (`shadowColor=light-dark(#000000,#000000);shadowOpacity=8;shadowOffsetX=0;shadowOffsetY=4;shadowBlur=10;`),
since draw.io's default is a hard offset that glows in the dark theme. The picture then looks right in the editor too.

Then, for each page, it exports the picture as draw.io draws it and writes, in a temporary folder of its own (or the one
given with `--out`) printed as `preview:` lines, `picture.drawio.svg` with the fonts embedded, `picture-light.png` and
`picture-dark.png`; a file with several pages gets `-p1`, `-p2` and so on. Each page is checked with the text as a
browser lays it out:

| Message | What to change |
| --- | --- |
| "a" overlaps "b" | two texts touch: move one, or shorten it |
| a line (eN) runs through "a" | an arrow crosses a text: reroute it, or move the label onto its own arrow |
| a line (eN) crosses "a" | an arrow passes through a card that is neither its source nor its target: add waypoints |
| "a" crosses the edge of "b" | a text sits across a card's or a compartment's border: move it fully inside or outside |
| "a" is wider (or taller) than its box by N px | the words run past their cell: resize the cell or shorten the words |
| the box of "a" overlaps the box of "b" | two cards or compartments overlap without one holding the other: move one |
| lines eA and eB cross | reroute one through another gap, or bridge the later one with `jumpStyle=arc;jumpSize=10;` |
| "7" is a numbered card | a number alone in a small cell: cards carry no numbers |
| "a" refers to step numbers | tell the order in words, without "(1, 2)" |
| "a" reads as a credit or a watermark | remove it, in the text, the page name, a tooltip or the file name: a picture never names the tool or the model that made it |
| "a" reads as AI slop | replace the buzzword with the plain fact, drop the exclamation mark or the emoji |

It exits with 1 while there is a problem, or when the check cannot run; a picture is done only when every page prints
"overlap check: clean" and both previews look right. The check cannot see a cramped composition, an empty corner, an uneven gap or a pale colour: read
the previews. To read small text, add `--zoom c12,e40` (cell ids, or words a cell shows): it writes a 3x close-up of
each, in both themes, beside the previews. `--scale` sets the previews' resolution (2 by default). It warns about
any `html=1` and any colour without a `light-dark()` pair. The previews are only for looking: hand over the `.drawio`.

It needs Node 18 or later, the draw.io desktop app and Chrome or Edge; set `DRAWIO` or `CHROME` when they are
somewhere unusual. draw.io runs one instance at a time, so an export started while another runs can fail; the script
tries again.

## Edit in place

To change a picture, change its `.drawio`: the cells' `value` is the text, `style` the look, `mxGeometry` the place.
A person does the same in the draw.io editor or the VS Code Draw.io Integration extension. draw.io drops a cell it
cannot read without saying so: after editing the XML by hand, export it back with
`drawio -x -f xml -o check.xml picture.drawio` and check that every cell is there.

## Gotchas

- A colour picked from the editor's palette is a plain hex, which draw.io inverts for the dark theme on its own and
  rarely well. Replace it with a `light-dark()` pair.
- A label placed with the default `x` lands in the middle of the route, often on a corner or in a gap. Place it with
  the formula above.
- `shadow=1` on an outlined card puts a halo around the outline. Only plain cards cast a shadow.
- An arrow's last stretch shorter than about 20 px bends into its head. Give the entry at least that much straight
  line.
- A hexagon needs `fixedSize=1`, or draw.io reads its size as a fraction and draws a bow tie.
- Text passed through `node -e` or `sed` can turn a `\n` into a real newline inside a string and break the file.
  Write scripts and XML with an editor or a file-writing tool.
