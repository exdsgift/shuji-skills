# Repository instructions

This repository is a collection of portable coding-agent skills. Keep the focus
on the skills and the supporting infrastructure minimal.

## Skills

- Store each skill in `skills/<skill-name>/SKILL.md` using the Agent Skills format.
- Include YAML frontmatter with `name` and `description`. The name must match the
  folder, use lowercase letters, digits, and single hyphens, and be 1–64 characters
  with no leading or trailing hyphen. The description must be 1–1024 characters
  and explain both the capability and when to use it.
- Keep instructions concise and self-contained. Add scripts, references, assets,
  dependencies, or agent-specific configuration only when the skill needs them.
- Use relative paths within skills so each folder can be installed independently.

## Keep documentation current

- Update affected documentation as part of every change, without waiting for a
  separate user request. Documentation is part of completing the task.
- When adding, changing, renaming, or removing a skill, update the root README's
  Skills section in the same change. Include each skill's name, a relative link
  to its `SKILL.md`, a short description, and when to use it. Keep entries sorted
  by name and remove the empty-state text when the first skill is added.
- Keep detailed usage in `SKILL.md`; keep README descriptions consistent with it.
- Update setup instructions and this file when repository conventions change.
  Document current behavior, not planned features.

## Before finishing

- Check changed skill metadata, relative links, and README coverage.
- For a new or substantially changed skill, try a representative request; run
  added or changed scripts with meaningful sample inputs when practical.
- Run `git diff --check` and review the changed files. Report any checks that
  could not run. There is currently no repository-wide build or test suite.
