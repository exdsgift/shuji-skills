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
- Give every skill a `samples/` folder of PNGs showing what it produces, picked from reviewed evaluation results and
  committed. `SKILL.md` points the agent at them, because an example shows the target faster than a description.
- Add `scripts/`, `references/`, `assets/` or `evals/` only when the skill needs them, and use relative paths so each
  folder installs on its own.

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
  name linked to its `SKILL.md` and one or two sentences on what it does. Keep rows sorted by name and the README
  minimal; detailed usage belongs in the skill itself.
- Update this file when repository conventions change. Document current behaviour, not planned features.

## Before finishing

- Check changed skill metadata, relative links and README coverage.
- For a new or substantially changed skill, run its evaluations, or at least a representative request, and look at
  the results.
- Run `git diff --check` and review the changed files. Report any check that could not run. There is no
  repository-wide build or test suite.
