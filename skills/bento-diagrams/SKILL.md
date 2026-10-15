---
name: bento-diagrams
description: Designs any engineering or software diagram in the bento style, Apple's system look on a white or black page, picking the composition that fits the request, from swimlanes, stage columns, nested topologies, hub and spoke, trees, layered stacks, sequences, data models and state machines to roadmaps, comparison matrices and mind maps, all built from the same cards with a coloured icon tile, a bold title and short lines, with yellow decisions and loops, green outcomes, Instrument Sans, one .drawio file that follows the light and dark themes, checked so nothing overlaps. Use it whenever someone asks to draw, design, redraw, restyle or tidy up a diagram, flowchart, architecture, process, pipeline, org chart, roadmap or map of anything, even if they name no style.
---

# Bento diagrams

A bentō box (弁当) keeps each thing in its own compartment, and the arrangement carries the meaning. A bento diagram
works the same way: soft grey compartments hold the things, cards say what each thing is, thin arrows say what moves,
and a few coloured outlines say how a path ends. The look is Apple's system UI, minimal, tidy and quiet. The
composition changes with the question: a swimlane for who does what, a tree for who reports to whom, nested boxes for
where things run, a timeline for when.

The target is in [samples/](samples/): one PNG per composition in the dark theme, named after it, with the swimlanes
and the roadmap also in the light theme; a name ending in `-compact` shows the compact density. Look at the one
closest to the request before you start. Every rule below gives its reason, so you can judge the cases it does not
cover.

## The language every composition shares

- The page is white in the light theme and black in the dark one, drawn as a background so the picture looks the
  same wherever it is shown.
- A header sits top left: a small blue eyebrow in capitals ("RELEASE FLOW", or "FLOW 2 OF 6" in a series), a bold
  title that says what the picture shows, and one muted line under it.
- Compartments (lanes, columns, regions, layers) are soft grey with round corners and no outline. Each has a name in
  small capitals, after a Lucide glyph in its colour.
- Cards are white on the light page and dark grey on the black one, with no outline and a soft shadow in the light
  theme only. A card has a solid tile in a system colour with a white glyph, a bold title and one or two short muted
  lines. Cards carry no numbers: the arrows and the reading direction give the order, and the caption tells it in
  prose. Cards in one picture share one size.
- An outline is the only place colour marks a card: green for an outcome, red for a stop, a grey dash for a step that
  is a flow of its own, an orange dash for an option still open or an optional part, blue for work in progress. A decision is a diamond
  with a yellow outline.
- Arrows are grey, 2 px, orthogonal with rounded corners and a small solid head; one that goes back to an earlier
  step is yellow and dashed. A label sits on its arrow with the compartment's colour behind it, so the line breaks
  around the words.
- A caption under the picture tells the story in a sentence or two, and a legend row shows every kind of card,
  outline and line the picture uses, and nothing else.
- Type is Instrument Sans at 400 and 600, IBM Plex Mono for a command, a path, a field or a value. One file serves
  both themes: every colour is a light and dark pair.
- Two densities share this language. The regular one has tall cards with two lines of detail, for a picture of up to
  about eight cards where each step needs explaining. The compact one has low cards with one line on a tighter grid,
  about 30 % smaller, for a picture with more cards, a wide pipeline, or one bound for a slide or a document page.
  Pick by those rules unless the request names one; when both apply, the number of cards decides, and a few cards
  whose facts need two lines stay regular even on a document page.

## Choose the composition

Read the request for its question, then pick the composition that answers it. Do not force a request into the
composition you used last: a roadmap drawn as swimlanes or an org chart drawn as a flow hides the answer.

| The question | Composition | Shape |
| --- | --- | --- |
| Who does what, in what order? A process, workflow, approval, release, incident response | Swimlanes | one horizontal band per actor, cards in columns by turn |
| What happens at each stage? A CI/CD or data pipeline, a funnel, a board | Stage columns | one vertical column per stage, its cards stacked inside, arrows from column to column |
| Where does each thing run? Deployment, network, cloud topology, Kubernetes | Nested containers | boxes inside boxes (cloud, region, network, subnet), cards inside the innermost |
| What does it connect to? Integrations, an event bus, a system in its context | Hub and spoke | one central card, its neighbours around it on a ring, one labelled arrow each |
| Who reports to whom, or what breaks down into what? Org chart, taxonomy, work breakdown | Tree | the root on top, each level a row below, elbow connectors with no heads |
| Which way do we go? Triage, a decision procedure, a troubleshooting guide | Decision tree | yellow diamonds for questions, answers on the arrows, outcome cards at the leaves |
| What sits on what? A tech stack, a layered architecture, a platform | Layered stack | full-width layers top to bottom, each a band of cards side by side, few or no arrows |
| Who calls whom, when? An API exchange, a protocol, an auth flow | Sequence | participants in a row on top, dashed lifelines, messages top to bottom |
| What holds what? A database, a domain model | Data model | entity cards with their fields in mono, crow's-foot relations with a verb |
| What states can it be in? An order, a ticket, a job | State machine | state cards with their status code in mono, transitions labelled with the event |
| When does it happen? A roadmap, a migration plan, a release calendar | Roadmap | a month axis on top, one band per workstream, bars as long as the work, milestones, a line for today |
| Which option is best? Vendors, databases, designs | Comparison matrix | options as column heads, criteria as rows, a verdict glyph and a few words per cell, a verdict row |
| What are the parts of an idea? Onboarding topics, a brainstorm, a domain overview | Mind map | the idea in the middle, branches to both sides in their colours, leaves as small cards |
| What does it consist of, side by side? Strategy pillars, a capability map, team charters | Pillars | one column per group, its cards stacked inside, no arrows and no numbers |
| How does a person get there? Signup, onboarding, support | Journey | stages as columns, rows for what the person does, sees and feels, pain points in red |

A request can mix two compositions: an architecture whose arrows tell a flow keeps its containers and lets its
arrows tell the order. When a process fits both swimlanes and stage columns, pick stage columns if every stage can end the process or
there are more than about seven steps, and swimlanes if the hand-offs between people are the point. When none fits,
use the language above on the plainest grid that answers the question. The exact geometry of each composition is in
[references/drawio.md](references/drawio.md).

## Tokens

These are Apple's system colours. Use them in any renderer.

| Role | Light | Dark | Used for |
| --- | --- | --- | --- |
| page | `#FFFFFF` | `#000000` | the background |
| compartment | `#F2F2F7` | `#1C1C1E` | lanes, columns, regions, layers, the label background on them |
| card | `#FFFFFF` | `#2C2C2E` | cards, diamonds, bars |
| divider | `#E5E5EA` | `#3A3A3C` | hairlines, a nested container's outline |
| ink | `#1D1D1F` | `#FFFFFF` | titles |
| muted | `#6E6E73` | `#98989F` | lines, compartment names, caption, legend |
| arrow | `#AEAEB2` | `#8E8E93` | arrows, the grey dash |
| arrow label | `#48484A` | `#D1D1D6` | words on an arrow |

| System colour | Light | Dark |
| --- | --- | --- |
| blue | `#007AFF` | `#0A84FF` |
| orange | `#FF9500` | `#FF9F0A` |
| green | `#34C759` | `#30D158` |
| purple | `#AF52DE` | `#BF5AF2` |
| indigo | `#5856D6` | `#5E5CE6` |
| teal | `#30B0C7` | `#40C8E0` |
| pink | `#FF2D55` | `#FF375F` |
| red | `#FF3B30` | `#FF453A` |
| yellow | `#FFCC00` | `#FFD60A` |
| grey | `#8E8E93` | `#8E8E93` |

Colour follows the actor or the group first, then the meaning. Give each compartment a system colour, and its cards'
tiles take that colour. Green, red, yellow and grey keep one meaning each in every picture (outcome, stop, decision or
loop, a flow of its own), so do not give them to a compartment. A card whose work differs from its group may take the
colour of its function: teal for data that moves, indigo for compute, pink for a screen or media. Never use colour
only to decorate. That leaves six colours for compartments (blue, orange, purple, indigo, teal, pink): with more
groups than that, group them further, or let groups of one kind share a colour and say so in the legend. A series of
pictures keeps one colour per actor, place or stage name throughout.

Cards cast a soft shadow: black at 8 %, 4 px down, blurred over 10 px. It reads on the white page and all but vanishes on
the black one, so a dark card never glows and stands out by its fill.

## Words

A card says what it is in a bold title of up to about 18 characters ("Run the checks") and one or two lines of up to
about 22 characters each ("lint, unit tests, build" / "in about six minutes"): who, how long, what goes in or out.
Use the words a reader already knows and plain verbs on arrows ("deploys", "if safe"); anything longer goes in the
caption. A name of code, a path or a value goes in mono (`status: paid`).

## No AI watermark, no AI slop

The picture must read as made by a careful engineer, never as generated.

- Never put a credit, a signature or a watermark anywhere: no "generated by AI", "made with Claude", "created with
  draw.io", "AI-generated", model names or tool names, in the picture, the caption, the alt text or the file name,
  for any reason, even when asked to brand the picture. The render script refuses such words.
- Words stay plain and specific. No buzzwords (seamless, robust, powerful, cutting-edge, leverage, empower, unlock,
  next-generation, AI-powered for something that is not), no emojis, no exclamation marks, no rhetorical or cute
  titles ("The magic of…", "Your journey to…"), no filler lines that say nothing ("and much more", "best practices").
  Every line on a card says a fact about that card.
- The visuals stay flat and quiet: no gradients, glows, neon, glassy or 3D effects, drop shadows in the dark theme,
  rainbow palettes or decorative icons. Never use sparkles, magic wands or stars to mean "AI": a model gets the
  glyph of what it does (a chat bubble, a brain, a bot) or its product's logo.
- No invented precision: a number, a version, a size or a date appears only when the source states it. When the
  source contradicts itself (five waits for eight attempts), draw what it states and point out the gap in your reply. An ending or
  a step that follows plainly from what the source says may be drawn; a claim, a target or a relation it does not
  make may not.
- Naming a product that is part of the system (a Claude card in an assistant's architecture) is a fact, not a
  credit. A company's own logo, when asked for, is fine; the tool or the model that drew the picture never is.
- A request for a tone ("inspiring", "make it pop", "futuristic") gets clarity, not effects: a direct title, a well
  told caption, and emphasis only from what the style already has (an outline, a milestone, today's line). When a
  request asks for a credit or for effects, draw without them and say so in one line in your reply; attribution, if
  it is needed, belongs in the deck's notes.
- The render script refuses a credit, the common buzzwords, an exclamation mark and an emoji in any text.

## Icons

- Lucide is the one glyph family (https://lucide.dev/icons, ISC licence): about 1,500 line icons with the same 2 px
  stroke and round ends, close to SF Symbols. On a tile the glyph is white; beside a compartment's name it is drawn in
  the compartment's colour. Never mix a second glyph family into the same picture.
- A product keeps its own logo, on a tile tinted with its brand colour at 13 % instead of a solid one, because a logo
  cannot turn white. Look in draw.io's own libraries for cloud services and Kubernetes, then LobeHub for AI brands
  (https://icons.lobehub.com/), then Simple Icons for any other (https://simpleicons.org/). A black or navy mark sits on
  a light chip in the dark theme, or it disappears. When no source has the logo, the card takes the Lucide glyph of
  its function and names the product in its title.
- [scripts/icon.mjs](scripts/icon.mjs) fetches any of these and prints the draw.io style with the SVG embedded and
  recoloured.

The marks remain their owners' trademarks: use each one to name its product and never restyle it.

## Patterns inside a flow

- A decision is a diamond with a short question ("Healthy?"); each answer leaves by its own side, labelled with the
  answer. Keep it to two or three answers.
- A loop back is a yellow dashed arrow from the decision to the step it repeats, routed along a free band above the
  cards. Several loops share that line into one entry.
- A merge joins its arrows into one trunk before the card, so the card has one way in; a fan-out is the same trunk
  the other way. Parallel work forks from one card and joins at one card.
- A timer or an escalation is an arrow labelled with its condition ("after 24 h") into a card with an orange tile and
  a clock, timer or hourglass glyph.
- A retry with backoff is that timer card with two ways out: a yellow dashed loop back to the step it repeats, and an
  arrow labelled with the limit ("after attempt 8 fails") to the red ending that gives up.
- A decision sits in the band of the actor whose answer decides it (the customer's endpoint answers, so "2xx within
  10 s?" sits in the customer's band); its answers then rise or fall into the bands that act on them.
- A step that is a flow of its own is a grey dashed card whose line names that flow ("replays: flow 3"); an option
  still open is an orange dashed card.
- An ending is an outlined card that says what the reader gets ("Promote to 100%: the release is done"): green when
  it succeeds, red when it stops. An outcome followed by more work is not an ending; draw the work, then the ending.
- Never number the cards, not even in a long flow: numbers turn a picture into a list and send the eye back and
  forth between the cards and the caption. The order comes from the arrows, the main path reading left to right or
  top to bottom, and a caption that tells it in prose without step numbers.

## Process

1. Fix the one question the picture answers and who reads it, and choose the composition. List the pieces, then cut:
   a piece the question does not need goes, and two pieces that always travel together become one card. A flow past
   about fourteen steps (endings included) splits into pictures, one question each, and the eyebrow numbers them
   ("FLOW 2 OF 5"). A map, a tree, a matrix or a pipeline whose stages a reader wants side by side may hold more,
   as long as every card keeps its size and nothing crowds.
2. Choose the density, name the compartments and give each its colour and glyph.
3. Lay the cards on the composition's grid in [references/drawio.md](references/drawio.md). Never shift a card off
   the grid to save space: the regular grid is most of what makes the picture calm.
4. Place every arrow last. Pin its exit and entry sides, and route it through the gaps with waypoints, so it crosses
   no card and as few other arrows as possible. A label needs a straight stretch of its own: put it where an arrow
   changes compartment or where a column is left free for it, never in a 22 px gap between two cards.
5. Write the caption, telling the order in prose with no step numbers, and build the legend from what the picture
   uses, sizing each of its words with `node scripts/measure.mjs`.
6. Run `node scripts/render.mjs picture.drawio`. It finishes the model in place (label backgrounds, soft shadows),
   then writes previews of both themes in a temporary folder and checks every page. Read both PNGs, fix what the check or your eye finds, and render again until it prints
   "overlap check: clean" and both themes look right.
7. Deliver the `.drawio` file, with the caption and a one-sentence alt text in your reply.

## Checklist

Copy this into your work and tick it for each picture, in both themes:

```
- [ ] The composition answers the question the request asks
- [ ] render.mjs prints "overlap check: clean"
- [ ] No arrow crosses a card, a compartment name or another arrow without need
- [ ] Every card has a tile and a glyph, from one glyph family; products keep their logos
- [ ] Every card holds a title and one or two short lines, and nothing wraps or spills
- [ ] No card carries a number, and the caption tells the order in prose without numbers
- [ ] Green, red, yellow and grey dash appear only with their meaning
- [ ] The legend shows every kind of card, outline and line in the picture, and nothing else
- [ ] The dark theme has no glow, no invisible logo and no unreadable text
- [ ] No credit, watermark or tool name anywhere; no buzzword, emoji or sparkle glyph
```

## Gotchas

- A label in the 22 px gap between two cards, or in the gap between two compartments, touches both sides. Give it a
  stretch of its own.
- A logo can vanish in one of the two themes. A white-only mark takes its brand colour; a dark one (black, navy, a
  deep blue) sits on a light chip in the dark theme; a pale one (yellow, light cyan) on a dark chip in the light
  theme.
- A gridline or a today line drawn as an ordinary arrow is reported for every card it crosses. Give it
  `bento=guide`, and stop it short of any words.
- A glyph drawn in `currentColor` turns black once embedded. The icon script colours it for you.
- An image of the picture takes its theme from the page around it or from the operating system, so check the themes
  with the previews the script writes, not with an `<img>`.
- A picture regenerated from scratch loses every hand fix. Once it exists, edit the cells in place.
