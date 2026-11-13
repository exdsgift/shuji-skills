# toryo-loop setup

The values the toryo-loop skill reads for this repository. The master reads this file at the start of every session;
the guard hook reads `Default branch:`, `Worktree cap:` and the `guard` block. Change a value through a ticket, or by
hand; mark a value nobody chose `(default)`.

## Repository

- Slug: `acme/widgets`
- Default branch: `main`
- Branch protection: required checks `lint` and `unit`; no required review (the reviewer agent is the review)
- Organisation SSO: a 403 from gh means the token needs SSO authorising for the acme organisation

## Agents

| Role | Model | Effort |
| --- | --- | --- |
| executor | `opus` | medium |
| executor-light | `sonnet` | medium (default) |
| reviewer | `fable`, then `sonnet` (order of preference; never the executor's unless none is available) | high for A, medium for B and plan reviews, low for C |

- House-style skill named in every brief: `acme-style`

## Tracks

- Core paths (any change there is track A): `src/widgets/core/`, `migrations/`
- Track B size: at most about 100 lines besides tests (default)
- PR cap: about 400 lines besides tests; a larger ticket is sliced (default)
- Mechanical paths left out of review: `docs/screenshots/`

## Pipeline

- One-file-per-entry registries (overlap allowed): `changelog.d/`, `migrations/versions/`
- Hot files (overlap forbidden): `src/widgets/registry.py`, `tests/conftest.py`, `pyproject.toml`
- Worktree root: `~/src/wt/`
- Branch naming: `<type>/<short>`, with type one of feat, fix, docs, chore
- Worktree cap: 6

## Build

- Tests: `uv run pytest -q`
- Local checks, in order, each must exit 0: `uv run ruff check`, `uv run pyright`, `uv run pytest -q`
- Type-check gate: `uv run pyright` on `src/` only
- Changelog: one file per pull request in `changelog.d/<issue>.md`
- Minor bump when: a price, a score or a status a customer sees changes meaning, or the public API changes
- Commit form: conventional commits; trailer: `Co-Authored-By: <agent> <noreply@example.com>`

## PR

- Body skill: the template at `.github/PULL_REQUEST_TEMPLATE.md`
- Diagram rule: a Mermaid diagram when a pull request changes who calls whom, a state machine or the schema
- Agent marker, the body's first line: `Opened by an agent (toryo-loop).`
- Agent label: `agent`
- Forbidden labels: `release`, `security` (the operator's)
- Docs-only rule: docs-only changes still go through a pull request, track C

## Landing

- Land command: `gh pr merge <N> --merge --match-head-commit <sha>` (default)
- Required checks: `lint`, `unit`
- Allowed-red pattern: `docs-mirror` may be red while the outside docs host is down; the closing comment names it
- Bots that write to the default branch: `acme-release-bot` (tags only)

## Trackers

- Map issue (the queue): #10
- Deferred issue: #11
- Nits issue: #12
- Decision label: `decision`
- In-progress marker: label `status:in-progress`
- Mirror: none
- Offline-check registry: `docs/live-checks.md`
- Label taxonomy: `docs/labels.md`

## Safety

- Secrets file: `.env`, filled by the operator; no agent reads it
- Running jobs are read, never killed
- Literal policies: no customer name or API key in a test fixture

```guard
^rm\b.*\s(\./)?data(/|\s|$) :: data/ holds the customer export fixtures and is not regenerable
^git\b.*\bpush\b.*\s(--force|-f\b|\+) :: force-pushing is the operator's, never an agent's
```

## Trials

- Open: none
- Closed: 2026-10-30, executor effort high to medium over tickets #31-#38: kept, ticket spend down by about a fifth,
  fix rounds unchanged

## Mode

- Default, when the operator names none: finish and stop. The current mode lives in the map issue.
