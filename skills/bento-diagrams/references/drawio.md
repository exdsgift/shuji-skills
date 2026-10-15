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
(right + 40, bottom + 40), where left, right and bottom are the outermost edges of the other cells, an arrow routed
outside the cards included. A card's cells keep their fixed widths; a header or caption cell is as wide as the
picture's content, no wider; every other text cell (an arrow label, a legend word, a row label) is as wide as its
words. A cell that reaches past the content widens the page, and render.mjs reports margins that differ by more than
24.

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
the glyph's place. Write every product tile this way and let render.mjs decide the chips: it measures each logo's
colours against its tile as each theme draws it, and when the mark would fade it rewrites the tile, with no opacity:

- A dark mark, all its colours under 3:1 on the dark tile (black, navy, PostgreSQL's `#4169E1`, Kubernetes' `#326CE5`,
  Kafka's near-black), gets a light chip in the dark theme: `fillColor=light-dark(<the 13 % tint>,#D1D1D6);`.
- A pale mark, all its colours under 2:1 on the light tile (yellow, light cyan, ClickHouse's `#FFCC01`), gets a dark
  chip in the light theme, `fillColor=light-dark(#2C2C2E,<the 13 % tint on dark>);`, so it reads as the product's own
  dark badge. A saturated colour (Redis' red, at 2.9:1 on its pale tint) still reads by its hue and keeps its tile.

It prints how many tiles it changed, and names a logo with most but not all of its colours faded (two dark colours
beside one bright one), for you to look at with `--zoom`; one pale colour among several, such as Google Cloud's
yellow, still reads. A brand colour inside a logo carries no meaning in the legend, even
when it is yellow, red or green. A wordmark (Adyen, a name written out) is unreadable at 20 px: let it fill the tile at
28 x 28.

### Alternatives on a card

A step that picks one of several alternatives (cost or time, DP or ILP) keeps them on its card instead of becoming a
chain of cards: the card's line becomes a row of pills, one per alternative, so the reader sees a choice, not more
steps.

```
pill: rounded=1;arcSize=50;fillColor=light-dark(#E5E5EA,#3A3A3C);strokeColor=none;fontSize=11;fontStyle=1;fontColor=light-dark(#1D1D1F,#FFFFFF);
```

Each pill is 18 high and as wide as its word plus 16, 6 apart, in the line's place: (x + 54, y + 35) on a compact
card, (x + 14, y + 71) on a standard one, whose second line then stays free or says what decides; a compact card has
no room for that, so its caption names what decides. When the pills do not fit the line (measure them), the
alternatives go on the line in mono, separated by commas.

### Compact density

Every measure in this file is the regular density. The compact density keeps the language and shrinks the grid, for
a picture with many cards or one that goes on a slide or a document page. Only these values change:

| Part | Compact |
| --- | --- |
| header | eyebrow 12/600 at y 14 (18 high), title 24/600 at y 32 (34 high), subtitle 14 at y 68 (22 high); the picture starts at y 112 |
| card | 216 x 64: tile 32 at (x + 12, y + 16), glyph 20 at (x + 18, y + 22); title 14/600 at (x + 54, y + 12), 150 x 20; one line, 12 muted or mono 11, at (x + 54, y + 33), 150 x 17 |
| band | 104 high, 8 apart; header column 120 wide: glyph 20 at (x + 16, y + 26), name 11/600 under it at (x + 16, y + 54) in a cell 100 x 20, hairline at x + 120; a name wider than 100 px goes on two lines, in a cell 100 x 30 at y + 48 with the glyph at y + 20, and one word wider than that is shortened; cards at x + 136 and band y + 20, columns 240 apart |
| box | header row 40 high (glyph 18 at x + 16, y + 12; name 11/600 at (x + 40, y + 11), 18 high), content at y + 40, padding 12, siblings 12 apart; cards stacked 76 apart (their 12 px arrows are straight, so they hold), or 120 when a labelled arrow runs between them |
| band, taller | a band of two rows, or one holding an outline box, centres the same glyph and name block on its height; cards end 16 before its right edge |
| outline box in a band | the band 136 high; the box from band y + 12 to y + 124, 12 outside its cards, its name 11/600 at box y + 8; its cards at band y + 48 |
| sequence | participants are compact cards 360 apart; messages 56 apart; a step card (64 high) takes one row, its messages at its middle, and a reply leaves from the lifeline under it; lifelines end 12 above the box's bottom |
| stage columns | 240 wide, 40 apart; a loop back 16 below the columns, the failure trunk 40 below them, its endings 100 below them |
| nested containers | card columns 240 apart through every level of one box; boxes side by side align their rows, not their columns |
| layered stack | compact bands, cards 12 apart (228 between their starts) from x + 136; a layer with fewer cards leaves the rest of its band empty |
| state machine | a band may hold two rows of states 120 apart (the band 224 high), so a transition between the rows carries its label in the 56 between them; the status code is the card's one line |
| tree | parents and children compact; hanging columns 264 apart |
| decision | 120 x 80 at card y - 8, the question 13/600 on two lines of about 10 characters (75 px) each, which the check tests against the slanted sides; its labelled answers leave by its sides into a free column, since the cards of neighbouring bands are only 48 apart |
| decision tree, ladder | rows 140 apart |
| loop back | 6 below the top of the band that holds the step it returns to, entering that step from the top: a 14 px last stretch, enough for the compact head |
| roadmap | month columns 120 wide; bars 36 high (title 12/600, line 11), rows 44 apart; band padding 16; milestone 12 |
| arrows | 1.5 px, `endSize=5`; labels 11 |
| caption, legend | caption 13; legend words 12 (width from `measure.mjs --size 12`, plus 4); samples 28 x 18, a line 28 long and a dashed one 36, a tile 18 x 18 |

A card has one line, so keep the essential words: the compartment already names what the title would repeat. Gaps of
24 between cards, 40 between columns and 48 between the cards of neighbouring bands hold no label: put labels where an
arrow crosses a free column or a band's empty slot, and drop a label that only says the flow goes on ("passes").

### Decision

```
rhombus;fillColor=light-dark(#FFFFFF,#2C2C2E);strokeColor=light-dark(#FFCC00,#FFD60A);strokeWidth=2;fontSize=14;fontStyle=1;fontColor=light-dark(#1D1D1F,#FFFFFF);
```

160 x 112, centred where a card would be: at (card x + 9, card y + 4). The question is its own label, up to about 14
characters a line, two lines at most with `&#xa;`; the check reports words that run past the slanted sides, which a
bounding box would hide. A labelled answer needs a straight stretch, so
the card it leads to sits one column further on, or in another band, never in the next slot 31 px away.

### Caption and legend

```
caption: text;fillColor=none;strokeColor=none;align=left;verticalAlign=middle;fontSize=14;fontColor=light-dark(#6E6E73,#98989F);
words:   text;fillColor=none;strokeColor=none;align=left;verticalAlign=middle;fontSize=13;fontColor=light-dark(#6E6E73,#98989F);
```

The caption is one line, 24 below the picture: it cannot wrap, so it holds about one character per 7 px of the
picture's width (6 px at the compact 13); each further sentence goes in its own cell 22 below, three at most, or four
in a narrow picture, which should never widen to fit its caption. The legend is one row whose top is 24 below the
caption's bottom: for each kind, a 34 x 22 sample, 8 px, its words, 28 px to the next; a legend wider than the picture
wraps into a second row 34 below. A picture with one kind of card and one kind of arrow needs no legend. Make each word cell as wide as its words plus 4, measured with `node scripts/measure.mjs "a step" "the
release is done"` (add `--size 12` at the compact density): a per-character estimate leaves the gaps uneven, since
Instrument Sans letters vary a lot in width. A card sample is `rounded=1;arcSize=30;fillColor=light-dark(#FFFFFF,#2C2C2E);`
with the kind's outline, or `strokeColor=light-dark(#D1D1D6,#3A3A3C)` for a plain card so it shows on white; a
decision is the rhombus; a line or a crow's foot is a free-standing arrow 34 long with the same style as in the
picture, except a dashed line, which is 40 long so its dashes end on a dash rather than a stub. A tile kind (a timer,
a colour shared by two groups) is a 22 x 22 tile flush left in the sample's place, with its words 8 after it. Boxes
name themselves and stay out of the legend, except a dashed logical boundary, whose sample is a dashed outline filled
with the compartment grey so it differs from a plain card on white; pills explain themselves and stay out too.

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
| from any state, a free start | `startArrow=oval;startFill=1;startSize=5;` |
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
A loop back runs 8 below the top of the band that holds the step it returns to, above that band's cards, and enters
its step from the top, so it never detours through bands it does not touch; when that strip holds a box's name, it
runs through the nearest free column instead. Its label goes on its vertical stretch.

- An ending that stops the flow (the launch fails) sits in the band of the actor who stops it, in the first free
  column after the step that fails, however far along, entered from the left. Only when that band has no free column
  does it go in the band below, which otherwise reads as if that band's actor stopped it. Never put it in a slot
  behind the step, where its arrow would read as going back.
- A place that several actors read and write (a bucket, a queue) is a band of its own at the bottom, so its arrows fan
  out to the steps above without crossing; one grey arrow then means a next step or data moving, and the legend says
  both.
- A part that runs inside another actor's process (an optimizer inside the server's worker) is not a band of its own:
  it is an outline box (the nested container style below) inside that actor's band, around its cards. The band grows
  to 216; the box runs from band y + 16 to band y + 200 and 12 outside the cards it holds, its name 11/600 at (box x +
  12, box y + 8), and its cards sit at band y + 60.

### Stage columns

Columns 220 wide at x = 20 + 300 j, 80 apart, from y 138 to the bottom of the tallest. Each has a header row; its
cards are standard, at x + 21, the first at y + 56, then every 136 (16 apart). An arrow from one column to the next
leaves a card's right side and enters a card's left side; its label sits in the 80 between columns, on the page
colour (`labelBackgroundColor` the page pair, from the table above), up to about 7 characters. Cards in one column
join by short unlabelled arrows downward; a stage that picks one of several alternatives keeps them on one card as
pills (see "Alternatives on a card").

A loop back (the next round) cannot run above the columns, where their headers are: it runs under them, 24 below, and
enters the column it returns to from below. A check that can fail is a card, not a diamond: the next card follows it,
and its failure leaves by the column's bottom, with the column box as the arrow's source, pinned at its bottom centre
(or the failing card itself when it is the column's last). The failures of several columns join one trunk 56 below
the columns, under the loop, into a red outlined ending in a row 128 below them; a failure that crosses the loop's
line bridges it (`jumpStyle=arc;jumpSize=10;`). The ending sits under the middle failing column; failures with
different reasons keep their own labels on their drops, before they join. The last column's own failure runs down its
right side, 32 out, to an ending under it. A side step that leads back into the flow (block the failed choice, then
try again) is an ordinary card in the endings row, its tile in its column's colour, with the loop leaving it and its
label on that rise; when the column the loop returns to also sends a failure from its bottom, the loop enters its
target card at `entryX=0.75` so the two never meet. Endings count toward the size of the picture.

### Nested containers

The outermost container is a filled box with a header row. A container inside it is drawn as an outline only, so the
nesting stays readable:

```
rounded=1;absoluteArcSize=1;arcSize=28;fillColor=none;strokeColor=light-dark(#D1D1D6,#3A3A3C);strokeWidth=1.5;
```

with `dashed=1;dashPattern=6 4;` for a logical boundary (a subnet, a namespace) rather than a physical one. Each has a
header row, its content 56 below its top and at least 20 of padding; siblings are 24 apart. Keep the card columns
aligned through every level of one box, on one grid 200 apart, and let the padding absorb the difference. Arrows
between containers cross their outlines at right angles and carry their labels inside a container. An arrow that
enters a box from above lands 12 or more clear of its name; the check reports a line nearer than that to any words.
A box can be an arrow's source or target, pinned at the height of its header row.

- A system with no one outer boundary (a client, a controller, the clusters it starts) has top-level boxes side by
  side, 24 apart, each filled with its header row, tops aligned. Do not wrap them in an outer box that only adds an
  empty corner.
- Each box takes its own height. Its cards stack from its top and never spread apart to line up with a neighbour's
  rows: a hole inside a box reads as something missing, and the check reports a gap between two cards of one box that
  is taller than the cards and holds nothing. A box with one card is as small as that card allows.
- A labelled arrow between two side-by-side boxes has no stretch of its own in the 24 between them: leave the facing
  column of one box free for it, or carry the label on a vertical hop inside a box, or drop a label the card already
  says. A nested box beside a card sits one column away from it, never 12 px.

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
least 160 between the boxes. The hub is a standard card in the regular density and may be compact in the compact one;
in the regular density the spokes are standard cards on the page, with no box of their own.

- Spokes that talk to each other, not through the hub (a load balancer in front of the replicas): put the part they
  meet as a sub-hub on the side of the hub's box that faces them, and run the arrows that bypass the hub through a
  free column, never across it.
- A group whose arrows go both ways (our own systems: one calls in, another listens) is not a spoke: draw it as the
  box around the hub, its cards in a row above it, each with its own short labelled arrow.
- A group may sit above or below the hub as well as beside it; its trunk then runs vertically.
- A store that every stage writes to (a log, a trace store, metrics) sits under the picture: short drops from each
  stage join one trunk into it, labelled once ("logged for review").

### Tree and decision tree

The root is centred on top, at y 138. Each level is a row 216 below the last (a card plus 96); siblings are 200
apart, and 240 between two groups of cousins, so each family reads as one. A parent is centred over the middle of its
first and last child. A connector leaves the parent's bottom, drops 40 to a bar shared by all its children, and drops
again into each child's top: `endArrow=none` for an org chart or a breakdown, a head for a decision tree. A
responsibility that is not a person (an on-call rotation) is a line on the cards that carry it, not a card.

A level of more than about eight cards is too wide for a slide: hang each parent's children in a column under it
instead. Parents and children are then compact cards. The children sit 24 right of their parent's left edge, the first
96 below the parent's top, then every 76. One connector per child leaves the parent's bottom 12 in from its left
(`exitX=0;exitY=1;exitDx=12;exitDy=0;`), runs down the shared spine and enters the child's left side at its middle,
with no head; the connectors overlap on the spine, which the check allows. Families sit 264 apart (a card, its indent
and 24 between), and the parents keep the level spacing above. When the branches end differently (one kind is deleted,
another kept, another stopped), say each branch's fate on its leaves' line, or close the branch with one outlined leaf:
red for what is removed, green for what stays.

In a decision tree, the questions are diamonds and the answers are labels on each child's vertical stretch (56 long).
When every leaf is an answer, as in a classification, outline every leaf green and let its tile colour rank them;
when some leaves stop the procedure, outline those red.

A chain where one answer always ends is a ladder, not a staircase:

- The rungs, questions and cards alike, run down one column, each centred on it, 184 apart centre to centre (140
  compact), so the answer that goes on ("no") fits on the vertical stretch between two rungs.
- Each ending sits to the right of its rung, its middle on the rung's middle and its left edge 120 right of the
  diamond's right corner, with the answer on that stretch. A card that is a rung (tear down, then block) sends its
  own ending to the same column.
- A loop back to an earlier rung (try the next zone) runs up a channel 40 left of the column's widest card, and at
  least 80 left of the diamonds' left corners, and enters its target from the left. Loops that return to the same
  rung share the channel: the longest is the full loop, each other a stub with `endArrow=none` that joins it, its
  answer on its stretch between the diamond and the channel. Loops that return to different rungs take one channel
  each, 40 apart, the loop to the highest rung outermost.
- A branch that skips rungs leaves by the diamond's right corner, runs down a channel 40 right of the diamonds,
  carries its answer on that channel's vertical stretch, and joins the entry of the rung it reaches 20 above it. The
  endings then sit 160 right of the diamonds, each answer on the stretch between the channel and its ending, and an
  ending's arrow that crosses the skip bridges it.
- A retry with no limit is a timer card as the last rung, with no ending: its one way out is the loop, in the outer
  channel, and its own line says so ("every 30 s, no limit"). Say "no limit" only when the source shows a loop with no
  cap.

### Layered stack

Bands like swimlanes but 112 high with compact cards at y + 24, 12 apart, the top layer the one closest to the user
and the bottom the hardware or the platform. Arrows only for a dependency that skips a layer. A layer
whose cards are alternatives (one database or another) says so in its name. At the compact density the layers are
compact bands and the cards stay 12 apart; a layer with fewer cards leaves the rest of its band empty.

### Sequence

One box around the exchange. Participants are standard cards in a row at box y + 56, 400 apart. From
each card's bottom a lifeline drops to the box's bottom less 24, drawn as dashed segments between the cards on it, so
no line crosses a card. Messages are horizontal arrows between lifelines, 56 apart down the page, each with a verb,
the first 56 below the participants' bottom; a message is a free-standing arrow (its `sourcePoint` and `targetPoint`
on the two lifelines) unless it leaves or enters a card. A message that passes a lifeline bridges it with
`jumpStyle=arc`. A step a participant does on its own is a card centred on its lifeline, with the messages entering
and leaving its sides on the 56 grid: pin them at `exitY=0.5;exitDy=-28;` and `exitDy=28;` (the same for entry), since
0.25 and 0.75 of a 120-high card fall off the grid. Two messages sent at once into one card enter it on the same row
from its two sides. The result is an outlined card on the lifeline of the participant that holds it. An exchange of
more than about fourteen messages splits into pictures, like a flow.

### Data model

Regions by domain, each a box. An entity is a card 248 wide: the tile at (x + 14, y + 14), the title at
(x + 56, y + 12), 178 x 20, one line at (x + 56, y + 33), 178 x 17, a hairline
(`line;strokeColor=light-dark(#E5E5EA,#3A3A3C);`) at y + 62, 220 wide, then one row per field from y + 72, 18 apart:
the name in mono 12 ink at x + 16, the type in mono 12 muted right-aligned to x + 232. Its height is 84 plus 18 per
field. When the longest row does not fit (measure the name and the type with `--mono --size 12`, plus 24 between
them and 32 of padding), widen every entity to that width rounded up to 8, and move the type's right edge with it.
Entities are 424 apart across (from x to x) and 48 apart down within a box, so a verb and two crow's feet fit between
them even across a region's padding. No numbers.

Relations: one to many is `startArrow=ERmandOne;endArrow=ERmany;`, one to one `ERmandOne` at both ends, zero or one
`ERzeroToOne`, zero or many `ERzeroToMany`. A key kept only by convention, with no foreign key behind it, is the same
line dashed (`dashed=1;dashPattern=6 4;`), its verb saying so ("by id"). A model spread over two databases takes one
region per database, named for it, and every relation between the two is dashed. A relation's label needs its
straight stretch between the two markers: the label plus 40.

### State machine

Bands for stages, on the swimlane grid; each state is a card whose second line is its status code in mono. Every
transition carries its event, so the grid's labelling rule matters most here: a state's next state in the same band
leaves a column free, or sits in the next band. The happy path reads left to right; endings are outlined.

- An event that can happen in every live state (a cancel, a controller that dies) is one free-standing arrow into its
  target, never one per state: it starts with a dot (`startArrow=oval;startFill=1;startSize=5;`) on the edge nearest
  the target, the right edge of its band or the top of a free column, and its label names the event and where it comes
  from ("cancel, from any running state"). When one card starts that event (the user's cancel), the arrow leaves that
  card instead, and the label still says it applies to any live state.
- At the compact density a band may hold two rows of states, 120 apart, so a transition between them carries its label
  in the 56 between the rows. A compact state card keeps its status code as its one line; the fact goes on its
  transitions or in the caption.
- A state with three or more exits sends its main path from a quarter of its height and its failures from three
  quarters, so each failure drops into the row below with its label in the gap.
- A state every failure passes through (shutting down) fans out to its endings over one bar under it; those drops may
  go unlabelled when each ending's title names its cause, and an ending with no status code takes a plain line.
- A band of calls (what the client does) may head the bands of states; the legend then says "a call, or a state".

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

- A row that describes rather than judges (what it decides from, when it acts) has no verdict tile, since a check or a
  cross there would be an invented verdict: its cell is one or two lines of words from column x + 14.
- A feature that does not exist is the red `x` tile, never a red outline, which means a stop.
- An option that applies only when someone chooses it takes an orange tile with a `sliders-horizontal` glyph in the
  verdict row, its line saying what turns it on, and the legend names it ("opt in").
- Options of different families (managed services and ones you run) get a family row above the header cards: the
  family's name in small capitals 11/600 muted over a hairline as wide as its options, and 40 more between two
  families.

### Mind map

The idea is a standard card in the middle, its tile blue, even though it is taller than the compact branches. Up to
three branches on each side are compact cards, each
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

- Up to six pillars sit in one row; more wrap into rows of up to six, 24 apart, the last row from the left, split
  evenly (ten as five and five) and by kind when the groups come in kinds. More groups than colours share colours by
  kind, and the legend says so.
- When the cards line up by role across the pillars (load, mount, copy), every pillar keeps each role in the same
  row, and a row label names the role on the left: small capitals 11/600 muted, in a column 120 wide, 12 before the
  first pillar, centred on its row's cards. Each row of pillars repeats the labels. A role a pillar does not support
  leaves its slot empty, with "not supported" in 12 muted at its middle, never a red card. A pillar's header names
  its group in the words the reader types (`store: s3`), and its first card names the product, with its logo.

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
| mono, 12 / 11 | about 7.2 / 6.6 px | 22 characters in 160 / 22 in 150 |

Put a bare `--` before words that start with dashes: `node scripts/measure.mjs --mono -- "--retry-until-up"`. A name
longer than its line (a 159 px service account in a 150 px mono line) widens every card in the picture by the
difference, rounded up to 8, when a few pixels are missing; otherwise the card shows its distinctive part and the
caption the full name. Mono stays at 400: a mode or an enum that titles a card stays in the title's font.

## Icons

`node scripts/icon.mjs lucide:<name>` prints a cell style with the white glyph embedded; add a colour
(`lucide:server #007AFF`) for a compartment's glyph. `lobe:<slug>` and `si:<slug>` fetch a product's logo in its
colours; a mark that comes in one plain colour (LobeHub's mono marks, a wordmark such as IBM's) takes its brand colour
as the second argument, `lobe:ibm #0F62FE`. Find Lucide names at https://lucide.dev/icons; the script says so when a
name does not exist.

Where a logo comes from, in this order:

1. draw.io's own libraries, for the services of AWS, Google Cloud, Azure and Kubernetes (the table below).
2. LobeHub, for AI brands and for the cloud companies' own logos: `lobe:aws`, `lobe:azure`, `lobe:googlecloud`,
   `lobe:microsoft`, `lobe:ibm`, `lobe:nebius`. Simple Icons has none of AWS, Azure, Microsoft, Oracle or IBM.
3. Simple Icons for any other brand (`si:postgresql`, `si:kubernetes`, `si:googlecloud`).
4. No source has Oracle's or SkyPilot's: the card takes the Lucide glyph of its function and names the product.

| Library | Style | Place |
| --- | --- | --- |
| AWS service | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.<service>;fillColor=light-dark(#C,#C);strokeColor=light-dark(#FFFFFF,#FFFFFF);aspect=fixed;` | in place of the tile, 32 x 32: the icon is its own coloured square |
| Google Cloud Storage | `shape=mxgraph.gcp2.cloud_storage;fillColor=light-dark(#4285F4,#4285F4);strokeColor=none;aspect=fixed;` | in place of the tile, 32 x 32 |
| Azure Blob Storage | `shape=mxgraph.azure.storage_blob;fillColor=light-dark(#0078D4,#0078D4);strokeColor=none;aspect=fixed;` | in place of the tile, 32 x 32 |
| Kubernetes logo | `shape=mxgraph.gcp2.kubernetes_logo;fillColor=light-dark(#326CE5,#326CE5);strokeColor=none;aspect=fixed;` | 20 x 20 on a tinted tile, which render.mjs makes a chip |
| Kubernetes resource | `shape=mxgraph.kubernetes.icon2;prIcon=<name>;fillColor=light-dark(#326CE5,#326CE5);strokeColor=light-dark(#FFFFFF,#FFFFFF);aspect=fixed;` | in place of the tile, 32 x 32 |

The Kubernetes resource names that draw: `ns`, `pod`, `deploy`, `svc`, `ing`, `cm`, `secret`, `vol`, `pv`, `pvc`,
`sa`, `role`, `rb`, `c_role`, `crb`, `node`, `job`. Their white rim vanishes on the white card, which is harmless.

When every card carries a product's icon (a Kubernetes picture), the tiles can no longer carry a group's colour: the
compartments' glyphs and names carry the grouping, and the legend says nothing about colour.

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
since draw.io's default is a hard offset that glows in the dark theme, and every tinted logo tile whose mark would fade
becomes a chip (see "Card"). The picture then looks right in the editor too.

Then, for each page, it exports the picture as draw.io draws it and writes, in a temporary folder of its own (or the one
given with `--out`) printed as `preview:` lines, `picture.drawio.svg` with the fonts embedded, `picture-light.png` and
`picture-dark.png`, and `picture-light.svg` and `picture-dark.svg`, one theme each with every colour resolved, for a
page that picks the theme itself (a README's `<picture>`); a file with several pages gets `-p1`, `-p2` and so on. Each page is checked with the text as a
browser lays it out:

| Message | What to change |
| --- | --- |
| "a" overlaps "b" | two texts touch: move one, or shorten it |
| a line (eN) runs through "a" | an arrow crosses a text: reroute it, or move the label onto its own arrow |
| a line (eN) crosses "a" | an arrow passes through a card that is neither its source nor its target: add waypoints |
| "a" crosses the edge of "b" | a text sits across a card's or a compartment's border: move it fully inside or outside |
| "a" is wider (or taller) than its box by N px | the words run past their cell: resize the cell or shorten the words |
| "a" runs past the slanted sides of its diamond | shorten the question's lines or split them: about 10 characters a line fit 120 x 80 |
| "a" and "b" are N px apart | two words on one row nearly touch: keep 6 px between them |
| a line (eN) passes N px from "a" | a line grazes words it neither carries nor enters: keep 12 px, or route it on the other side |
| the page has N px of empty space on the right | a cell wider than its words (often a caption or the header) or the background sets the page: size it to its words |
| the box of "a" has an empty gap of N px | its cards spread apart to line up with a neighbour: stack them from the box's top and let the box end under its last |
| the box of "a" overlaps the box of "b" | two cards or compartments overlap without one holding the other: move one |
| lines eA and eB cross | reroute one through another gap, or bridge the later one with `jumpStyle=arc;jumpSize=10;` |
| "7" is a numbered card | a number alone in a small cell: cards carry no numbers |
| "a" refers to step numbers | tell the order in words, without "(1, 2)" |
| "a" reads as a credit or a watermark | remove it, in the text, the page name, a tooltip or the file name: a picture never names the tool or the model that made it |
| "a" reads as AI slop | replace the buzzword with the plain fact, drop the exclamation mark or the emoji |

It exits with 1 while there is a problem, or when the check cannot run; a picture is done only when every page prints
"overlap check: clean" and both previews look right. The check cannot see a cramped composition, an empty corner, an uneven gap or a pale colour: read
the previews. To read small text, add `--zoom c12,e40` (cell ids, or words a cell shows): it writes a 3x close-up of
each, in both themes, beside the previews. An id wins over words; words frame the whole card that holds them, its
tile included, and pick the cell whose words match exactly before one that only contains them. `--scale` sets the previews' resolution (2 by default). It warns about
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
- An arrow's last stretch after a corner, shorter than about 20 px, bends into its head (14 px at the compact
  density, whose head is smaller). Give the entry at least that much straight line. A straight drop has no corner to
  bend, so the 12 px arrows between stacked cards hold.
- A hexagon needs `fixedSize=1`, or draw.io reads its size as a fraction and draws a bow tie.
- Text passed through `node -e` or `sed` can turn a `\n` into a real newline inside a string and break the file.
  Write scripts and XML with an editor or a file-writing tool.
