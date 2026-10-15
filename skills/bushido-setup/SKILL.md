---
name: bushido-setup
description: Sets up a repository so coding agents work well in it and its code stays lean, modular and changed in atomic steps. In a new repo it runs the stack's official generator (Python, TypeScript, Go, Rust, or a generic mode); in an existing one it adds only what is missing and overwrites nothing. It writes a short AGENTS.md with fifteen precepts from the classic programming manuals, per-folder agent files and process skills only where they carry facts the code does not show, docs kept current by CI, and installs companion skills (Matt Pocock's, ponytail, superpowers) for every agent. Run again, it audits the repo against the same rules. Use it as the first step in a new or existing repo, or whenever someone asks to set up, bootstrap, organise, onboard or audit a repo for coding agents, even if they do not name it.
---

# Bushido setup

Bushido is a code of conduct. This skill gives a repository one: precepts for the code, tools that enforce what a
tool can, and instruction files that tell every coding agent what the code does not show. It runs once to set a repo
up and again to audit it.

The target is in [samples/](samples/): a new Python service and an existing Node library whose agent files were
merged, each with its file tree and the `AGENTS.md` this skill wrote (named `*.example.md`, so no agent loads them as
instructions); the Node one keeps its plan. Read the one closest to the request before you start.

## Rules for every run

- Overwrite nothing. When a file exists, read it, plan the change, and apply the change after the user confirms it.
  Lockfiles change only through their own tool (`uv lock`, `pnpm install`, `go mod tidy`, `cargo`).
- Write facts the agent cannot find in the code: the user's answers, the repo's configs, scripts and CI. Context that
  a model paraphrased from the code makes agents slower and no more accurate.
- Give every file real content on the day you write it. When a file would hold only a heading or a placeholder, leave
  it out; it gets written when its first content arrives. A changelog's `Unreleased` section counts as content.
- Keep the root AGENTS.md under 100 lines. Every agent reads every line on every turn, so each line must change what an
  agent does.
- Write every file an agent reads in English, with the rules in [references/writing.md](references/writing.md). Files
  for people, such as a README, follow the user's language when they ask for it.
- Show the plan as a file tree and wait for the user's go-ahead before the first write.

## Setup

### 1. Detect

Read the repo without changing it, and record:

- the ecosystem, project kind and package manager, from the markers in
  [references/ecosystems.md](references/ecosystems.md) ("Detect"). When two lockfiles disagree, ask.
- the agent files: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursor/rules/`, `.github/copilot-instructions.md`, and
  nested ones. When the root `AGENTS.md` starts with the `bushido-setup` marker, run the [Audit](#audit) instead.
- the cross-cutting files, the CI workflows, `docs/`, and `.env*` file names. Read `.env.example`; never open a file
  that holds values, such as `.env` or `.env.local`.
- the companion skills already there: in the repo (`.agents/skills/`, `.claude/skills/`, `skills-lock.json`) and for
  the user (`claude plugin list`, `~/.claude/skills/`, `~/.agents/skills/`, `npx skills ls -g`).
- the git remote: GitHub, GitLab or none.

Done when each item has a value or "none".

### 2. Ask

Ask only what detection left open, in one message, at most five questions:

1. What are you building: a library, an app, a service or a CLI, under which name, and does it ship versions? In an
   empty repo, in which language?
2. Who works on it: only you, a team, or outside contributors? Do you track work in an issue tracker, and which one?
3. Does it use secrets? Name each one and where it lives, never its value.
4. Which license, and in whose name? Offer MIT, Apache-2.0, GPL-3.0, or none for private code. The user picks; you
   never pick one.
5. What must an agent know that the code does not show: a process (release, deploy, migration), a gotcha, a rule?

Done when each question you asked has an answer or a "skip".

### 3. Plan

Show one file tree of the repo after setup. Mark each path: **create**, **merge** (an existing file and the change),
**append** (lines added), **remove** (a file whose content moved elsewhere), **skip** (exists and stays), **run** (a
command). Mark **optional** every addition the repo does not need for the setup to work, such as a new formatter in an
existing repo; apply an optional item only when the user names it, and record the ones they decline in the marker
line of `AGENTS.md` (`declined: <item>, <item>`) so a later run does not offer them again. Under the tree, list the
companion skills to install and the ones you skip because the repo or the user already has them. Apply the user's
edits to the plan, then wait for the go-ahead.

Done when the user says go.

### 4. Scaffold

When the manifest is missing, run the ecosystem's generator in the repo root with the flags in
[references/ecosystems.md](references/ecosystems.md), then add its dev tools. Skip this step in the generic mode.
Never run `npm init` beside an existing `package.json`: it rewrites the file and still exits 0.

In an existing repo, keep the tools it already uses. Offer a missing formatter, linter or type checker as an optional
item of the plan, and never run a formatter or a fixer in write mode on existing code: that rewrites the user's files.

Give every formatter, linter and type checker an exclude for `.agents/` and `.claude/`, which will hold third-party
skill files.

Done when the project's lint, type check and tests pass. When the generator leaves no test, write one small test of
the code it generated; when that needs a new library, make the runner pass with no tests and say so in the hand-over.

### 5. Cross-cutting files

Write the files in [references/repo-files.md](references/repo-files.md) that the plan marks create or append:
`README.md`, `.editorconfig`, `.gitattributes`, the `.gitignore` lines, the CI workflow, `dependabot.yml`, `LICENSE`,
and, when the project has secrets, `.env.example`, `docs/secrets.md` and the Claude Code deny rules.

Done when the CI workflow holds every check in the "CI" section of that file.

### 6. Agent files

Follow [references/agent-files.md](references/agent-files.md):

- the root `AGENTS.md` from its template, with the precepts from [references/precepts.md](references/precepts.md)
  copied word for word;
- `CLAUDE.md` holding `@AGENTS.md`, and `.gemini/settings.json`;
- an `AGENTS.md` and `CLAUDE.md` pair in a folder only when that folder has a rule the code does not show;
- `docs/README.md`, and `docs/agents/` from [assets/docs-agents/](assets/docs-agents/);
- `GLOSSARY.md` and `docs/adr/` only when step 2 gave them content, and `CHANGELOG.md` when the project ships
  versions;
- a process skill for each process the user described in step 2, and none they did not describe.

When agent files exist, merge them as the "Merge" section of that file says: move their content, never delete it.

Done when each rule and fact for agents from step 2 sits in exactly one agent file, and the root `AGENTS.md` is under
100 lines.

### 7. Companion skills

Install them as [references/companion-skills.md](references/companion-skills.md) says: project scope, real copies,
an explicit list, and no skill the repo or the user already has. Then write the "Skills" lines of `AGENTS.md` from that file.

Done when `.agents/skills/` and `.claude/skills/` hold the same files except `code-review`, and `skills-lock.json`
lists every installed skill.

### 8. Verify

Run these in order and record each result:

1. the project's lint, format check, type check and tests;
2. the "Agent files" check from the CI workflow, run locally, and `lychee --offline` when it is installed;
3. steps 1 and 3 again, ignoring the marker: the plan must come out empty apart from the declined optional items,
   which proves a second run changes nothing;
4. the always-loaded cost: the lines of the root `AGENTS.md` and the number of skills an agent lists at start.

Done when every check has a result. A check that could not run is reported as not run, with the reason.

### 9. Hand over

Tell the user, in at most ten bullets: what you created, merged and skipped; the verify results; the always-loaded cost;
the files a described process needs that the repo does not have yet (a deploy workflow, a Dockerfile); the companion
skills you skipped, which teammates must install themselves; and what to do next. The next steps are: review the diff, commit it as one commit, and run bushido-setup again to audit the repo
after it grows.

## Audit

Run the audit in [references/audit.md](references/audit.md) when the root `AGENTS.md` carries the marker, or when the
user asks for one: detect, check every item, report what is missing, what is out of line and what is fine, propose
the fixes, and apply the fixes the user confirms.

Done when every item in the audit list has a verdict.

## References

- [references/precepts.md](references/precepts.md): the fifteen precepts as `AGENTS.md` carries them, and how an
  audit checks each. Read it in step 6 and in an audit.
- [references/writing.md](references/writing.md): the writing rules for every file an agent reads. Read it before
  you write one.
- [references/agent-files.md](references/agent-files.md): the `AGENTS.md` template, `CLAUDE.md`, the Gemini settings,
  per-folder pairs, `docs/`, memory files, process skills, and the merge of existing agent files. Read it in step 6.
- [references/companion-skills.md](references/companion-skills.md): which skills to install, the commands, and the
  `AGENTS.md` lines. Read it in step 7.
- [references/ecosystems.md](references/ecosystems.md): detection, generators, tools and commands for Python,
  TypeScript, Go and Rust. Read it in steps 1 and 4.
- [references/repo-files.md](references/repo-files.md): the cross-cutting files, secrets and the CI workflow. Read it
  in step 5.
- [references/audit.md](references/audit.md): the audit checklist and its report. Read it when you run an audit.
