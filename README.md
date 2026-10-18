# shuji

秀技: skills for coding agents, in the [Agent Skills](https://agentskills.io/specification) format.

## Skills

| Skill | What it does |
| --- | --- |
| 🍱 [bento-diagrams](skills/bento-diagrams) · 弁当 | Draws engineering diagrams in Apple's system look: swimlanes and regions on a white or black page, cards with coloured icon tiles, yellow decisions, green outcomes, light and dark in one file, checked for overlaps. Named after the bentō, the lunch box with a compartment for each thing. |
| 🖌️ [sumi-diagrams](skills/sumi-diagrams) · 墨 | Writes diagrams and charts as Mermaid text rendered by Pele: all 32 types, chosen by the question asked, in grey with one accent on the arrowheads and the Okabe-Ito colours for chart series. Delivers one SVG for both themes, a light and dark pair for a README, or a checked block for an Obsidian note or a pull request, where it marks what the change adds. Named after sumi, the ink of brush painting: grey ink and one vermilion seal. |
## Install

Any agent ([Claude Code, Codex, Cursor, Gemini CLI, Copilot and more](https://github.com/vercel-labs/skills)),
with Node.js:

```bash
npx skills add exdsgift/shuji-skills --skill bento-diagrams
npx skills add exdsgift/shuji-skills --skill sumi-diagrams
```

Add `-g` to install for every project and `-a claude-code` (or `-a codex`, and so on) to pick the agent without a
prompt. `npx skills update` pulls new versions.

Claude Code, every skill as one plugin from this repository's marketplace:

```bash
claude plugin install shuji --marketplace exdsgift/shuji-skills
```

The skills run as `/shuji:bento-diagrams` and `/shuji:sumi-diagrams`, or on their own when a request fits. To receive
new versions without asking, open `/plugin`, select `shuji` under Marketplaces and select Enable auto-update; otherwise
`claude plugin update shuji@shuji` pulls them. If you installed `bento-diagrams@shuji` or `sumi-diagrams@shuji`
before, run the install command above once: it replaces them.

Or copy a skill's folder into your agent's skills directory: `~/.claude/skills/` for Claude Code, `~/.agents/skills/`
for Codex.

## License

[MIT](LICENSE), © 2026 Gabriele Durante. Each skill carries a copy of the license in its folder, since it installs on
its own.

As the copyright holder, I also give this permission: what the skills write from this repository into yours, such as
the diagrams' own layout and words, may be used without this notice. Parts by others keep their own terms, named
beside them: in diagrams, the embedded Instrument Sans and IBM Plex Mono fonts (SIL Open Font License) and Lucide
glyphs (ISC). Product logos remain their owners' trademarks.

## Citation

To cite these skills, use [CITATION.cff](CITATION.cff), or GitHub's "Cite this repository" button.
