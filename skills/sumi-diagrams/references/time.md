# Time: gantt, timeline, git graph, kanban

Read this when the question is "when?" or "where does each thing stand?". Every example below renders clean with
`scripts/render.mjs` on Pele 1.6.0.

## Gantt

Answers: when each task of a plan runs, how long, and what depends on what.

```mermaid
gantt
  accTitle: Kubernetes 1.31 upgrade
  accDescr: Staging upgrades first and soaks for a week; production's control plane follows, then its node pools roll one after another.
  title Kubernetes 1.31 upgrade
  dateFormat YYYY-MM-DD
  axisFormat %d %b
  todayMarker on
  section Staging
    Control plane   :done, sc, 2026-10-05, 2d
    Node pools      :done, sn, after sc, 3d
    Soak            :active, soak, after sn, 7d
  section Production
    Control plane   :pc, after soak, 1d
    General pool    :pg, after pc, 2d
    GPU pool        :crit, pgpu, after pg, 3d
  section Milestones
    Upgrade done    :milestone, fin, 2026-10-27, 0d
```

- `dateFormat` is how you write dates; `axisFormat` is how the axis prints them (`%b` month, `%d` day, `%Y` year).
  Every date must match `dateFormat`: a mismatch draws the task nowhere, without an error.
- A task is `Name :tags, id, start, length` where start is a date or `after id`, and length is `3d`, `2w` or an end
  date. Tags: `done`, `active`, `crit`, `milestone`. `excludes weekends` skips weekends.
- Bars are neutral in this theme; `crit` tasks and the today line take the accent. The render script's `--now`
  fixes "today" for a reproducible picture.

## Timeline

Answers: what happened when, in order: release history, an incident timeline, a roadmap of past milestones.

```mermaid
timeline
  accTitle: Platform releases
  accDescr: Version 1 brought the public API and webhooks in 2025; version 2 added gRPC, rate limits and multi-region in 2026.
  title Platform releases
  section 2025
    v1.0 : Public API
    v1.4 : Webhooks
  section 2026
    v2.0 : gRPC transport : Rate limits
    v2.3 : Multi-region
```

- `period : event : event`; a line starting with `:` adds an event to the period above. `section` groups periods.
- A period cannot hold a colon, quoted or not: an incident timeline writes `09#58;12 : Alerts fire`, which prints
  as 09:12. The script reports every time written with a colon.
- Between 640 px and its natural width a timeline does not adapt and scales down; past about eight periods, split.

## Git graph

Answers: how branches, merges and tags of a repository relate: a branching model, a release, a cherry-pick.

```mermaid
gitGraph
  accTitle: Hotfix on a release branch
  accDescr: Work lands on main; release 3.2 is cut, and a fix made on main is cherry-picked onto it and tagged v3.2.1.
  commit id: "feat: search filters"
  branch release/3.2
  commit id: "3.2.0" tag: "v3.2.0"
  checkout main
  commit id: "fix: null cursor"
  commit id: "feat: saved views"
  checkout release/3.2
  cherry-pick id: "fix: null cursor"
  commit id: "3.2.1" tag: "v3.2.1"
```

- `commit id: "…" tag: "…" type: HIGHLIGHT`, `branch name`, `checkout name`, `merge name`,
  `cherry-pick id: "…"`. Branches start from the branch checked out.
- Give every commit an `id`: unnamed commits get hashes like `0-9e3779b`, which read as noise.
- Each branch takes the next series colour, so keep to five or fewer.
- `branch hotfix order: 1` sets the lane order (lower is nearer `main`): put a branch next to the branches it merges
  into, so its curves do not cross every lane.

## Kanban

Answers: where each work item stands, by column.

```mermaid
kanban
  accTitle: Payments board
  accDescr: Two items wait to start, one is in progress with Ana, and one is in review.
  todo[To do]
    retry[Retry failed webhooks]@{ ticket: PAY-112, priority: 'High' }
    docs[Document refunds API]
  doing[In progress]
    idem[Idempotency keys]@{ assigned: 'ana', ticket: PAY-98 }
  review[In review]
    limits[Rate limit per merchant]@{ ticket: PAY-101 }
```

- Columns at the first level, items indented under them; `@{ ticket: …, assigned: '…', priority: '…' }` adds
  metadata (`Very High`, `High`, `Low`, `Very Low`). Frontmatter `config: kanban: ticketBaseUrl: '…#TICKET#'` links
  tickets.
