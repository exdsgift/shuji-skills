# Hierarchies: mindmap, tree view, treemap, ishikawa

Read this when the question is "what does it break down into?". Every example below renders clean with
`scripts/render.mjs` on Pele 1.6.0.

## Mindmap

Answers: what the parts of a topic are, branching from one centre: an overview, onboarding topics, a brainstorm.

```mermaid
mindmap
%% accTitle: Observability
%% accDescr: Observability splits into metrics, logs and traces, each with its tool and one policy.
  root((Observability))
    Metrics
      Prometheus
      SLO burn rate
    Logs
      Loki
      Retention 30 days
    Traces
      OpenTelemetry
      Tail sampling
```

- Indentation is the structure: every child is indented more than its parent, with spaces only and the same step
  throughout. Mixed indentation re-parents nodes without an error.
- Shapes: `((circle))` for the root, `[square]`, `(rounded)`, `{{hexagon}}`, `))bang((`, `)cloud(`.
- Mindmap cannot hold `accTitle`/`accDescr` statements: write them as `%%` comments at column 0, as above.
- Past about 25 nodes, split by branch.

## Tree view

Answers: how files and folders nest: a repository layout, a package, a config tree.

```mermaid
treeView-beta
  accTitle: Inventory package layout
  accDescr: The package code is in src/inventory, with the HTTP routes in api.py; tests sit beside it and pyproject.toml at the root.
inventory/
├── pyproject.toml ## build and dependencies
├── src/inventory/
│   ├── api.py :::highlight ## HTTP routes
│   ├── models.py
│   └── stock.py
└── tests/
    └── test_stock.py
```

- Two forms: children indented under their folder with spaces, or `tree` output (`├──`, `└──`, `│`) pasted as it
  is, as above. Box-drawing lines start at column 0 even when `accTitle` and `accDescr` are indented: indented
  box-drawing lines fail ("Unexpected indentation without box-drawing characters"). A trailing `/` marks a folder.
- `## text` after a name adds a description. `:::highlight` is the tree view's key: it marks the one file the text
  is about.
- Icons: frontmatter `config: treeView: showIcons: true` draws file icons from Pele's set; leave them off unless
  asked.

## Treemap

Answers: how a total divides into nested parts, sized by value: disk use, a budget, lines of code.

```mermaid
treemap-beta
  accTitle: Monorepo size by package
  accDescr: Services hold most of the code, orders being the largest; libraries and the web dashboard follow.
  "services"
    "orders": 42
    "search": 31
    "auth": 18
  "libs"
    "proto": 12
    "telemetry": 9
  "web"
    "dashboard": 27
```

- Quoted names, nested by indentation; leaves carry `: value`. Frontmatter `config: treemap: valueFormat: '$0,0'`
  formats the numbers.
- Each top-level item takes the next series colour, and everything under it shares that colour. Do not wrap the
  whole tree in one root (`"monorepo"`): a single top-level item paints the whole map in one colour. Name the total
  in the title instead. Keep to five or fewer top-level items.

## Ishikawa

Answers: what causes contribute to one problem, sorted by category.

```mermaid
ishikawa-beta
  accTitle: Slow checkout causes
  accDescr: Slow checkouts trace to the database, the network, the code and the process.
  Checkout p95 over 2 s
  Database
    Missing index on orders.user_id
    Connection pool too small
  Network
    No keep-alive to the payment API
  Code
    N+1 queries in cart totals
  Process
    No load test before release
```

- The first line is the problem; each unindented line after it is a category; indented lines are causes, and causes
  can nest.
- On a narrow screen Pele draws it as a cause tree.
