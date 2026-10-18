# Charts: pie, xychart, quadrant, radar, sankey, venn

Read this when the request carries numbers to show. Every example below renders clean with `scripts/render.mjs` on
Pele 1.6.0.

A chart with one series (one bar or line series, the points of a quadrant, one radar curve, a git graph with only
`main`) wears the accent, the theme's orange, so a picture never carries a second colour it does not need; the script
does this by itself. From two series on, colour says which series is which: series wear the Okabe-Ito colours (Okabe
& Ito 2008) in the theme's fixed order: blue, green, vermillion, pink, orange, sky, yellow. In that order every two neighbours stay apart under
protanopia and deuteranopia (worst simulated distance 11, against a target of 8). Three rules follow:

- The first series takes the first colour, always; a series keeps its colour when others are added or removed.
- Six series at most. A seventh becomes "Other", or the chart splits into small multiples.
- Sky and yellow, the sixth and seventh colours, are pale on white: a chart that reaches them labels its series
  directly or keeps the legend beside them. Never rely on colour alone: give every series a name so it has a
  legend entry.
- One measure per chart: never two y-axes. Two measures with different units make two charts.

## Pie

Answers: how one whole splits into a few parts.

```mermaid
pie showData
  accTitle: Where CI time goes
  accDescr: Tests take almost half of each CI run, compilation a quarter, the rest is lint, the image and the upload.
  title Where CI time goes (minutes per run)
  "Tests" : 46
  "Compile" : 27
  "Lint" : 12
  "Docker image" : 10
  "Upload" : 5
```

- `"Label" : value`, labels always quoted. `showData` prints the values in the legend.
- Order the slices from largest to smallest; past five slices fold the smallest into "Other" and name what it holds
  in the description, not in the slice. Keep slice names under about 24 characters: Pele centres each legend entry
  on its own width estimate, so long names drift. For changes over time or comparisons between wholes, use bars.

## XY chart

Answers: how a value changes over an ordered axis (time, version, size), or how categories compare.

```mermaid
xychart
  accTitle: Disk use on the database nodes
  accDescr: Over eight days db-1 climbed from 61 to 88 percent while db-2 and db-3 stayed between 40 and 55.
  title "Disk use (%)"
  x-axis [D1, D2, D3, D4, D5, D6, D7, D8]
  y-axis "%" 0 --> 100
  line "db-1" [61, 64, 68, 71, 75, 79, 84, 88]
  line "db-2" [44, 45, 47, 46, 48, 50, 49, 51]
  line "db-3" [40, 42, 41, 43, 44, 47, 52, 55]
```

- `x-axis [a, b, c]` for categories or `x-axis "Label" 0 --> 100` for numbers; `y-axis "Label" min --> max`.
  `bar [...]` and `line [...]` series; `xychart horizontal` turns the bars.
- Name every series, `line "API" [...]`: with names Pele draws a legend; without them the reader cannot tell the
  lines apart. Past three lines, split the chart.
- One bar series is one colour, the accent: a bar's length already shows its value, so never colour bars by value.
- Start a bar axis at 0. Frontmatter `config: xyChart: showDataLabel: true` prints the values on the bars.

## Quadrant

Answers: where items sit on two judgements: effort and impact, risk and value.

```mermaid
quadrantChart
  accTitle: Tech debt triage
  accDescr: Flaky tests and the slow build are cheap and painful, so they come first; the ORM rewrite is costly.
  title Tech debt: effort and pain
  x-axis Low effort --> High effort
  y-axis Low pain --> High pain
  quadrant-1 Plan it
  quadrant-2 Do it now
  quadrant-3 Leave it
  quadrant-4 Question it
  Flaky tests: [0.25, 0.85]
  Slow build: [0.35, 0.7]
  ORM rewrite: [0.85, 0.6]
  Old admin UI: [0.7, 0.2]
  Log noise: [0.15, 0.3]
```

- Points are `Name: [x, y]` with both numbers between 0 and 1; outside that range is a syntax error.
- `quadrant-1` is top right, then counter-clockwise: 2 top left, 3 bottom left, 4 bottom right.

## Radar

Answers: how a few options compare on several criteria of the same scale.

```mermaid
radar-beta
  accTitle: Datastore options
  accDescr: Postgres leads on ecosystem and cost, DynamoDB on latency and operations, Cassandra on throughput.
  title Datastore options (1 to 5)
  axis lat["Latency"], thr["Throughput"], ops["Ops effort"], cost["Cost"], eco["Ecosystem"]
  curve pg["Postgres"]{4, 3, 4, 4, 5}
  curve dy["DynamoDB"]{5, 5, 5, 2, 3}
  curve cs["Cassandra"]{4, 5, 2, 3, 3}
  max 5
  min 0
```

- `axis id["Label"], …` then `curve id["Name"]{v1, v2, …}` with one value per axis, in axis order.
- `max`, `min`, `graticule polygon` (or `circle`). Three curves at most: past that, use a table or bars.

## Sankey

Answers: how a quantity flows and splits between stages: traffic, budget, energy.

```mermaid
sankey
%% accTitle: Request flow
%% accDescr: Of 1000 requests at the CDN, 380 are static assets and 620 reach the API, which splits them across orders, search and auth.
CDN,API gateway,620
CDN,Static assets,380
API gateway,Orders,260
API gateway,Search,240
API gateway,Auth,120
Orders,Postgres,200
Orders,Queue,60
Search,OpenSearch,240
```

- One `source,target,value` row per flow. Names are plain ASCII with no quotes in Pele 1.6.0: no accents, no
  CJK, no commas.
- Sankey cannot hold `accTitle`/`accDescr` statements: write them as `%%` comments at column 0, as above.
- Nodes take the series colours in the order they first appear, and the eighth node onward is grey: list the main
  flows first. Frontmatter `config: sankey: suffix: "k"` adds a unit to the values; `showValues: false` hides them.
- Past about 12 nodes the labels collide: merge small flows.

## Venn

Answers: how a few sets overlap: skills, features, responsibilities.

```mermaid
venn-beta
%% accTitle: On-call skills
%% accDescr: Backend and SRE skills meet in the incident lead; SRE and data skills meet in pipeline operations.
  title On-call skills
  set Backend
  set SRE
  set Data
  union Backend,SRE["Incident lead"]
  union SRE,Data["Pipeline ops"]
```

- `set Name` or `set A["Label"]:size`; `union A,B["Label"]`; `text A1["Item"]` under a set lists its items.
- Three sets at most. Venn cannot hold `accTitle`/`accDescr` statements: write them as `%%` comments.
