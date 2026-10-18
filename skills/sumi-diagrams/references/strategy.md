# Strategy and grammar: wardley, cynefin, railroad

Read this for a value-chain map, a sense-making frame, or the syntax of a language. Every example below renders clean
with `scripts/render.mjs` on Pele 1.6.0.

## Wardley map

Answers: which components serve a user need, how visible each is, and how evolved (genesis to commodity).

```mermaid
wardley-beta
  accTitle: Search platform value chain
  accDescr: Developers need search; the query API depends on a custom ranker, an index and cloud compute, with the index evolving to a product.
  title Search platform
  anchor Developers [0.95, 0.75]
  component Query API [0.80, 0.65]
  component Ranking model [0.60, 0.30] (build)
  component Search index [0.45, 0.55] (buy)
  component Compute [0.15, 0.90] (market)
  Developers -> Query API
  Query API -> Ranking model
  Query API -> Search index
  Search index -> Compute
  Ranking model -> Compute
  evolve Search index 0.75
  note "Buy the index, build the ranker" [0.35, 0.40]
```

- Coordinates are `[visibility, evolution]`, both 0 to 1: visibility runs up, evolution runs right (genesis,
  custom, product, commodity).
- `anchor` is the user or need on top; `component Name [v, e]` with optional `(build)`, `(buy)`, `(outsource)`,
  `(market)`, `(inertia)`. Links are `A -> B`; `evolve Name 0.8` draws where it is heading.
- `pipeline Name { component "A" [0.3] … }`, `note "text" [v, e]`, `annotation 1,[v, e] "text"`,
  `accelerator`/`deaccelerator "text" [v, e]`, `size [1100, 800]`.
- You place everything: two components at nearby coordinates collide, and a link can cross a third component. The
  render script reports labels that collide when a browser is available; look at the preview for links, and move
  a component by 0.05 or more.

## Cynefin

Answers: which domain each item sits in (clear, complicated, complex, chaotic, confusion), and how items move between
domains.

```mermaid
cynefin-beta
  accTitle: Incident response by domain
  accDescr: Restarts and known fixes are clear, performance analysis complicated, root cause complex, and paging chaotic.
  title Incident response
  complex
    "Investigate root cause"
  complicated
    "Analyse performance data"
  clear
    "Restart the service"
    "Apply the known fix"
  chaotic
    "Page on-call now"
  complex --> complicated : "Pattern found"
```

- A domain keyword on its own line, its items quoted and indented under it; `confusion` is the centre.
- `domain --> domain : "label"` draws a movement between domains.

## Railroad

Answers: what the syntax of a language or format is: a config grammar, a query language, an identifier rule.

```mermaid
railroad-ebnf-beta
  accTitle: Version string grammar
  accDescr: A version is three numbers separated by dots, with an optional pre-release tag after a hyphen.
  title "Version string"
  version = number "." number "." number [ "-" tag ] ;
  number = digit { digit } ;
  tag = letter { letter | digit } ;
```

- Four dialects: `railroad-ebnf-beta` (`=`, `|`, `[ ]` optional, `{ }` or `( )*` repeated, `;` ends a rule),
  `railroad-abnf-beta` (`/`, `1*`, `*`), `railroad-peg-beta` (`<-`, `/`, `!`), and `railroad-beta` with functions
  (`sequence`, `choice`, `zeroOrMore`, `terminal`, `nonterminal`).
- A name used but not defined (`digit`, `letter` above) is drawn as a box to look up: define it when the reader
  needs it.
- Long sequences wrap onto connected rows on narrow screens.
