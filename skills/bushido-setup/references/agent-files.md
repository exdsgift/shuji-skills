# Agent files

The layout spends context only where it helps. Every agent reads the root `AGENTS.md` on every turn. A folder's
`AGENTS.md` loads when an agent works in that folder (Claude Code through the `CLAUDE.md` beside it, Cursor, Copilot,
Gemini CLI); Codex loads only the files from the root down to the folder it started in, so the root lists the nested
ones. A skill costs one listing line at start, and its body loads only when it runs.

## Root AGENTS.md

Fill this template. Keep it under 100 lines.

```markdown
<!-- bushido-setup YYYY-MM-DD: run bushido-setup again to audit this repo. -->
# <Project name>

<One sentence: what the project is.>

## Commands

- <Only commands an agent would not guess: the fast single-test command, a required flag, a slow command to avoid.>

<The "Precepts" block from precepts.md, word for word.>

## Workflow

- Before you open a pull request, run the code review your agent provides at high effort: `/code-review high` in Claude Code, `/review` in Codex, the `code-review` skill elsewhere. Show the findings to the user and push only after their go-ahead.
- <When the project has secrets:> Keep secret values out of code, logs, docs and chat. docs/secrets.md lists each secret and where it lives.
- <Each rule or gotcha from step 2 that holds across the whole repo, one line each.>

## Skills

<The lines from companion-skills.md, minus the skills you skipped.>
<One line per process skill, e.g. "- To release, the user runs `/release`; never start it yourself.">

## Map

- `docs/README.md`: the index of the docs. Read it before you change behaviour a doc describes.
- `<folder>/AGENTS.md`: <what its rules cover>. Read it before you change files in `<folder>/`.

## Agent skills

### Issue tracker

<Where issues live, in one line. Leave this section out when the user tracks work nowhere.> See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the root, created when first needed. See `docs/agents/domain.md`.
```

- Put the marker on the first line. The audit looks for it, and Claude Code strips HTML comments before loading, so it
  costs Claude nothing.
- Add `### Triage labels` ("The five default roles. See `docs/agents/triage-labels.md`.") only when `triage` is
  installed.
- In "Commands", write only what an agent would get wrong without it. Generic commands such as "run the tests" raised
  cost in the ETH study and helped no task. When the ecosystem's defaults hold, keep one line: the fast single-test
  command.
- Leave out what an agent finds by looking or what does not change its work: a repo overview, the project's history,
  a directory tree, a tech-stack summary, file-by-file descriptions, rules a linter enforces, general virtues ("write
  clean code"), text copied from the README, and facts that change weekly.
- Put a rule for a folder that does not exist yet in the root; move it to the folder's own file when the folder
  arrives.

## CLAUDE.md

One line, `@AGENTS.md`, at the root and beside every nested `AGENTS.md`. Claude Code reads `AGENTS.md` natively only
from v2.1.277 and only when no `CLAUDE.md` exists at or above the working folder; the import works on every version and
never loads the file twice. A symlink would check out on Windows as a text file holding a path.

## Gemini CLI

`.gemini/settings.json`, because Gemini CLI reads only `GEMINI.md` by default:

```json
{ "context": { "fileName": ["AGENTS.md", "GEMINI.md"] } }
```

When the file exists, add the `context.fileName` key and keep the rest.

## Copilot in Visual Studio, JetBrains, Xcode or Eclipse

These chats read only `.github/copilot-instructions.md`. Write it only when the user says the team uses one of them,
as a pointer: "Follow the instructions in `AGENTS.md` at the repository root."

## Per-folder pairs

- Write `<folder>/AGENTS.md` only when the folder has a rule an agent cannot infer from its code: money held as
  `Decimal`, an applied migration that must never change, generated code to leave alone, a different test runner.
- Keep it under 40 lines, and repeat nothing from the root.
- Put `<folder>/CLAUDE.md` holding `@AGENTS.md` beside it. Once a root `CLAUDE.md` exists, Claude Code skips every
  `AGENTS.md` that has no `CLAUDE.md` of its own.
- Add its line to the root "Map". CI fails when a nested `AGENTS.md` is missing from the map or has no `CLAUDE.md`.
- Use nested `AGENTS.md` files for folder rules, never tool-specific path rules (`.claude/rules/`, `.cursor/rules/`,
  `.github/instructions/`): each of those reaches one tool only.

## docs/

- `docs/README.md` is the index: an H1, one sentence, then one line per entry of `docs/`:
  `- [secrets.md](secrets.md): each secret, its purpose and where it lives. Read it before you add one.`
  CI fails when an entry of `docs/` is missing from it.
- `docs/agents/` holds the configuration Matt Pocock's skills read, written from
  [assets/docs-agents/](../assets/docs-agents/) (MIT, Copyright (c) 2026 Matt Pocock; the notice is in
  `LICENSE-mattpocock-skills`). Copy that license file into `docs/agents/` beside them, and start each written file
  with `<!-- From mattpocock/skills, MIT: see LICENSE-mattpocock-skills. Written by bushido-setup. -->`.
  - `issue-tracker.md`, only when the user tracks work: from `issue-tracker-github.md` or `issue-tracker-gitlab.md`
    when the tracker is GitHub or GitLab issues, from `issue-tracker-local.md` when the user tracks work in files.
  - `domain.md` from `domain.md`, always.
  - `triage-labels.md` from `triage-labels.md`, only when `triage` is installed.
- `docs/secrets.md` follows [repo-files.md](repo-files.md).
- Write no `ARCHITECTURE.md` and no overview: repository overviews did not help agents in any study.
- Any other doc gets a folder by its kind (how-to, reference, explanation) when its first content arrives.

## Memory

- `GLOSSARY.md` at the root, only when step 2 named domain terms. Format:

  ```markdown
  # <Context name>

  <One or two sentences on what this context is.>

  ## Language

  **<Term>**:
  <One or two sentences on what it is.>
  _Avoid_: <synonyms not to use>
  ```

- `docs/adr/NNNN-<slug>.md`, numbered from `0001`, only for a decision that is hard to reverse, surprising without
  context and the result of a real trade-off. Write a title and one to three sentences on the context, the decision and
  the reason; add "Considered Options" only when the rejected options are worth remembering.
- `CHANGELOG.md`, whenever the project ships versions, in the Keep a Changelog 1.1.0 shape: newest first,
  `## [Unreleased]` on top, entries under `### Added`, `### Changed`, `### Fixed` and `### Removed`, written for people.
  The `Unreleased` section is its content from the first day.

## Process skills

- Write a process skill only from a process the user described, with only their facts. Skills a model writes from its
  own knowledge measured 8 to 11.5 points worse than no skill.
- Put it in `.agents/skills/<name>/SKILL.md` with an identical copy in `.claude/skills/<name>/`.
- Give it `name` and `description` frontmatter and numbered steps, each with one action and a done-check. Keep it
  under 100 lines and move detail into its `references/`.
- When the process acts outside the repo (a release, a deploy, a publish, a data change), let only the user start it:
  - add `disable-model-invocation: true` to the frontmatter, which Claude Code, Cursor and VS Code honour;
  - add `agents/openai.yaml` for Codex:

    ```yaml
    policy:
      allow_implicit_invocation: false
    ```

  - list it in the "Skills" section of `AGENTS.md`: agents that drop its description learn of it only from that line.
- A process that stays inside the repo, such as adding a payment provider, stays model-invoked, with a description that
  says when it applies.
- Write the user's steps, and only theirs. Fill in the commands that carry out a step they named (the `git` or `gh`
  call that pushes a tag); never add a step they did not name.
- When the process relies on files the repo does not have (a deploy workflow, a Dockerfile), list them in the
  hand-over; never write them yourself. When it leaves out a step a precept needs, such as moving the changelog's
  `Unreleased` entries under the new version, offer that step as an optional item of the plan.

## Merge

Run this when agent files exist, written by people or by a generator (create-next-app writes `AGENTS.md`, bun init
writes `CLAUDE.md`; set `BUN_AGENT_RULE_DISABLED=1` before `bun init` to prevent it).

1. Read each file and list its rules and facts, one per line, with the file each came from.
2. Give each line a place: the root `AGENTS.md` (it holds across the repo), a folder pair (one folder), `docs/` (detail
   read on demand), the README (an overview or the history, which are for people), or nowhere (a duplicate of a line
   kept elsewhere, or a style rule a configured tool enforces). List each contradiction with both versions.
3. Show this merge plan per file in step 3. For each contradiction, propose the precept's or the tool's version and
   let the user pick the other.
4. After the go-ahead for a file, move its lines, then reduce `CLAUDE.md` to `@AGENTS.md`. Drop a line the user wrote
   only when the same line is kept elsewhere.
5. When the user declines a file, leave it untouched and say so in the hand-over.

Tool-specific rule files (`.cursor/rules/`, `.github/copilot-instructions.md`, `.claude/rules/`) merge the same way.
Remove each one only after the user confirms it.
