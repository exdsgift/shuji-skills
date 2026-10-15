# shuji

秀技: skills for coding agents, in the [Agent Skills](https://agentskills.io/specification) format.

## Skills

| Skill | What it does |
| --- | --- |
| 🍱 [bento-diagrams](skills/bento-diagrams) · 弁当 | Draws engineering diagrams in Apple's system look: swimlanes and regions on a white or black page, cards with coloured icon tiles, yellow decisions, green outcomes, light and dark in one file, checked for overlaps. Named after the bentō, the lunch box with a compartment for each thing. |
| ⚔️ [bushido-setup](skills/bushido-setup) · 武士道 | Sets up a new or existing repo for coding agents: the stack's official generator, fifteen precepts from the classic programming manuals in a short AGENTS.md, folder instructions and process skills only where they carry facts the code does not show, docs and CI that keep them current, and companion skills for every agent. Run again, it audits the repo. Named after the samurai's code of conduct. |

## Install

Any agent ([Claude Code, Codex, Cursor, Gemini CLI, Copilot and more](https://github.com/vercel-labs/skills)),
with Node.js:

```bash
npx skills add exdsgift/shuji-skills --skill bento-diagrams
```

Add `-g` to install for every project and `-a claude-code` (or `-a codex`, and so on) to pick the agent without a
prompt. `npx skills update` pulls new versions.

Claude Code, as a plugin from this repository's marketplace:

```bash
claude plugin install bento-diagrams --marketplace exdsgift/shuji-skills
```

`claude plugin update bento-diagrams@shuji` pulls new versions. A plugin's skills carry its name as a prefix, so the
skill runs as `/bento-diagrams:bento-diagrams`.

Or copy a skill's folder into your agent's skills directory: `~/.claude/skills/` for Claude Code, `~/.agents/skills/`
for Codex.
