# Repository instructions

This repository is a collection of portable coding-agent skills. Keep the focus on the skills and the supporting
infrastructure minimal.

## Skills

- Store each skill in `skills/<skill-name>/SKILL.md` using the Agent Skills format.
- Give it YAML frontmatter with `name` and `description` only, so it loads in Claude Code and in Codex alike. The
  name matches the folder, uses lowercase letters, digits and single hyphens, and is 1 to 64 characters with no
  leading or trailing hyphen. The description is 1 to 1024 characters, written in the third person, and says what the
  skill does and when to use it, with the main use case first.
- Keep `SKILL.md` under 500 lines, with the most important rules at the top. Move details into `references/`, link
  each reference file directly from `SKILL.md`, and say when to read it.
- Give every skill a `samples/` folder showing what it produces, picked from reviewed evaluation results and
  committed: PNGs for a skill that draws, example outputs in their own format for any other (bushido-setup keeps a
  file tree and the `AGENTS.md` it wrote). `SKILL.md` points the agent at them, because an example shows the target
  faster than a description.
- Add `scripts/`, `references/`, `assets/` or `evals/` only when the skill needs them, and use relative paths so each
  folder installs on its own.
- Keep a `CHANGELOG.md` beside `SKILL.md`. It lives in the skill's folder, not at the root, because each skill installs
  on its own and its changelog travels with it.
- Put a copy of the root `LICENSE` (MIT) beside `SKILL.md`, for the same reason. A file taken from someone else keeps
  its own license notice next to it, and the skill's README names it.
- Give every skill a `README.md` beside `SKILL.md`: the showcase GitHub shows under the skill's folder, written for the
  people deciding whether to use it, with its strongest pictures in `showcase/`. `SKILL.md` never points at it, so an
  agent running the skill does not read it.

## Distribution

- `npx skills add exdsgift/shuji-skills` finds every skill under `skills/` with no extra file, for any agent the
  [skills CLI](https://github.com/vercel-labs/skills) supports.
- `.claude-plugin/marketplace.json` makes this repository a Claude Code plugin marketplace named `shuji`. Each skill
  is one plugin entry named after it, with `"source": "./"` and `"skills": ["./skills/<skill-name>"]` so only that
  folder loads. Leave out `version`: the commit is the version, so every push is a release.

A new skill starts from this shape:

```markdown
---
name: skill-name
description: Does what, for whom. Use when the user asks for this, or for that, even if they do not name it.
---

# Skill name

Instructions for completing the task, with an example when helpful.
```

## Evaluations

- A skill's test cases live in `skills/<skill-name>/evals/evals.json`: prompts with their expected output and
  assertions, plus queries that should and should not trigger it.
- Run each case with a fresh agent that reads only the skill, and write its output to
  `eval-results/<skill-name>/round-<n>/<case>/`, one round per version of the skill, so rounds can be compared. That
  folder is gitignored: results stay here to be inspected, never committed.

## Keep documentation current

- Update affected documentation as part of every change, without waiting for a separate request.
- When adding, changing, renaming or removing a skill, update the table in the root README in the same change: the
  name linked to its folder, where GitHub opens its `README.md` showcase, and one or two sentences on what it does. Keep rows sorted by name and the README
  minimal; detailed usage belongs in the skill itself.
- In the same change, add, update or remove the skill's entry in `.claude-plugin/marketplace.json`. Never rename a
  published entry; add a `renames` map instead, so existing installs keep working.
- In the same change, update the skill's `README.md` whenever the change adds a capability, changes what the skill
  does or changes how its output looks, without waiting to be asked. Start from the current README: keep its layout,
  its order and its voice, and change only what the change touched (a new section for a new capability, a corrected
  fact, an image rendered again from its source in `showcase/` when the look moved). Never rewrite it from scratch.
  The README's opening comment says how its images are made.
- In the same change, record what changed in the skill's `CHANGELOG.md`: newest first, one `## YYYY-MM-DD` heading
  per day something is pushed, bullets that say what changed for someone using the skill. There are no version
  numbers, since the commit is the version: the date tells a reader what `npx skills update` or
  `claude plugin update` brought.
- Update this file when repository conventions change. Document current behaviour, not planned features.

## Before finishing

- Check changed skill metadata, relative links and README coverage.
- When `.claude-plugin/marketplace.json` or a skill's folder changes, run `claude plugin validate .`.
- For a new or substantially changed skill, run its evaluations, or at least a representative request, and look at
  the results.
- Run `git diff --check` and review the changed files. Report any check that could not run. There is no
  repository-wide build or test suite.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default roles, each label named after its role. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the root, created when first needed. See `docs/agents/domain.md`.
