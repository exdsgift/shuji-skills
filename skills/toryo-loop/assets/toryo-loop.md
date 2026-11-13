# toryo-loop setup

The values the toryo-loop skill reads for this repository. The master reads this file at the start of every session;
the guard hook reads `Default branch:`, `Worktree cap:` and the `guard` block. Change a value through a ticket, or by
hand; mark a value nobody chose `(default)`.

## Repository

- Slug: `<owner>/<repo>`
- Default branch: `<main>`
- Branch protection: <required checks and reviews, or none>
- Organisation SSO: <a 403 from gh means the token needs SSO authorising, or "none">

## Agents

| Role | Model | Effort |
| --- | --- | --- |
| executor | `<strongest model>` | medium |
| executor-light | `<cheaper model>` | medium |
| reviewer | `<first choice>`, then `<second choice>` (order of preference; never the executor's unless none is available) | high for A, medium for B and plan reviews, low for C |

- House-style skill named in every brief: <skill, or none>

## Tracks

- Core paths (any change there is track A): `<path/>`, `<path/>`
- Track B size: at most about <100> lines besides tests
- PR cap: about <400> lines besides tests; a larger ticket is sliced
- Mechanical paths left out of review: <paths, or none>

## Pipeline

- One-file-per-entry registries (overlap allowed): `<changelog.d/>`
- Hot files (overlap forbidden): `<path>`, `<path>`
- Worktree root: `<~/src/wt/>` (an absolute path, so `git -C <worktree>` needs no base)
- Branch naming: `<type>/<short>`
- Worktree cap: 6

## Build

- Tests: `<command>`
- Local checks, in order, each must exit 0: `<lint>`, `<type-check>`, `<tests>`
- Type-check gate: <command, or none>
- Changelog: <convention, for example one file per pull request in changelog.d/>
- Minor bump when: <what changes what a number or a verdict means, or the public interface>
- Commit form: <for example conventional commits>; trailer: `<Co-Authored-By: ...>`

## PR

- Body skill: <skill, or the template at .github/PULL_REQUEST_TEMPLATE.md>
- Diagram rule: <when a pull request gets a diagram, or none>
- Agent marker, the body's first line: `<Opened by an agent (toryo-loop).>`
- Agent label: `<agent>`
- Forbidden labels: <labels an agent never sets, or none>
- Docs-only rule: <for example docs-only changes still go through a pull request>

## Landing

- Land command: `gh pr merge <N> --merge --match-head-commit <sha>`
- Required checks: `<check>`, `<check>`
- Allowed-red pattern: <a check name that may be red, and when, or none>
- Bots that write to the default branch: <names, or none>

## Trackers

- Map issue (the queue): #<n>
- Deferred issue: #<n>
- Nits issue: #<n>
- Decision label: `<decision>`
- In-progress marker: <a label such as `<status:in-progress>`, or a project status>
- Mirror: <tracker and project, or none>; sync traps: <for example "Fixes #N" does not move it>
- Offline-check registry: <file listing checks that need real hardware or a live service, or none>
- Label taxonomy: <where it is documented>

## Safety

- Secrets file: `<.env>`, filled by the operator; no agent reads it
- Running jobs are read, never killed
- Literal policies: <values that never go on the default branch, or none>

```guard
<Python regex, matched against one command at a time> :: <why it is refused>
```

## Trials

- Open: none
- Closed: none

## Mode

- Default, when the operator names none: <finish and stop | autonomous | one ticket>. The current mode lives in the map
  issue.
