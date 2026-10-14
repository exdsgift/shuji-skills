# shuji

秀技 — reusable skills for coding agents.

Each skill lives in `skills/<skill-name>/` and uses the portable
[Agent Skills format](https://agentskills.io/specification).

## Skills

No skills yet. As skills are added, this section will list each skill, what it
does, when to use it, and a link to its `SKILL.md`.

## Use a skill

Install or copy the entire chosen skill folder into your agent's supported
skills directory. Follow that agent's instructions for discovery and invocation;
the `skills/` directory here is the source collection.

## Add a skill

Create `skills/<skill-name>/SKILL.md` with YAML frontmatter and focused instructions:

```markdown
---
name: skill-name
description: Describe what the skill does and when to use it.
---

# Skill name

Instructions for completing the task, with an example when helpful.
```

Use lowercase letters, digits, and single hyphens for the name, matching the
folder name. Add `scripts/`, `references/`, or `assets/` inside the skill only
when needed, and reference supporting files using relative paths.

Update the Skills section above in the same change. Keep detailed instructions
in the skill itself and its README description short.

## Working on this repository

[AGENTS.md](AGENTS.md) contains the repository instructions for coding agents,
including the requirement to keep documentation current without a separate
request. For agents that do not discover `AGENTS.md`, include it in their project
instructions. This repository needs no build or dependency installation.

The structure follows the [Agent Skills specification](https://agentskills.io/specification)
and [AGENTS.md guidance](https://agents.md/).
