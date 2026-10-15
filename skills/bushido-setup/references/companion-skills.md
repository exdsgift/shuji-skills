# Companion skills

Three MIT-licensed packages cover the work around the code: Matt Pocock's skills (intent, tests, docs for agents, pull
requests), ponytail (how much code to write) and superpowers (debugging, evidence, integration). Each job has one
owning skill, named once in `AGENTS.md`. superpowers states that `AGENTS.md` overrides its skills, which is what lets
the three live together.

## The set

| Package | Skills | Folders |
| --- | --- | --- |
| `mattpocock/skills` | `setup-matt-pocock-skills`, `pr`, `writing-for-agents`, `grilling`, `grill-with-docs`, `domain-modeling`, `codebase-design`, `tdd`, `handoff` | both |
| `mattpocock/skills` | `code-review` | `.agents/skills/` only |
| `mattpocock/skills`, only when the user tracks work in an issue tracker | `to-spec`, `to-tickets`, `triage` | both |
| `DietrichGebert/ponytail` | `ponytail`, `ponytail-debt` | both |
| `obra/superpowers` | `verification-before-completion`, `systematic-debugging`, `receiving-code-review`, `finishing-a-development-branch` | both |

- `code-review` stays out of `.claude/skills/`: with the same name it would hide Claude Code's built-in `/code-review`,
  which the workflow uses at high effort. The other agents use Matt's skill.
- superpowers' process skills (`using-superpowers`, `brainstorming`, `writing-plans`, `executing-plans`,
  `subagent-driven-development`) and its `test-driven-development` stay out: they make a heavy process mandatory and
  contradict ponytail, and `tdd` owns tests.
- No plugin and no hook is installed. ponytail's always-on mode and superpowers' session bootstrap come only with their
  plugins; show the plugin commands from each package's README when the user asks for them.

## Skip what the user already has

Before installing, look for each skill at user scope: the plugins in `claude plugin list` (`mattpocock-skills`,
`ponytail`, `superpowers` carry all their skills), the folders `~/.claude/skills/<name>/` and
`~/.agents/skills/<name>/`, and `npx skills ls -g`. Leave a found skill out of the install and say so in the plan:
installing it again would list it twice, and teammates without it will need to install it themselves.

## Install

Run one command per package, with the list minus the skipped skills. Each command writes real copies, never links:
a committed link checks out on Windows as a text file and the agent then sees no skill.

```bash
npx skills@latest add mattpocock/skills --copy -y -a claude-code codex cursor github-copilot gemini-cli \
  -s setup-matt-pocock-skills pr writing-for-agents grilling grill-with-docs domain-modeling codebase-design tdd handoff
npx skills@latest add mattpocock/skills --copy -y -a codex cursor github-copilot gemini-cli -s code-review
npx skills@latest add DietrichGebert/ponytail --copy -y -a claude-code codex cursor github-copilot gemini-cli \
  -s ponytail ponytail-debt
npx skills@latest add obra/superpowers --copy -y -a claude-code codex cursor github-copilot gemini-cli \
  -s verification-before-completion systematic-debugging receiving-code-review finishing-a-development-branch
```

- `claude-code` writes `.claude/skills/`; the other four agents share `.agents/skills/`.
- The CLI writes `skills-lock.json`. Commit it: `npx skills experimental_install` restores the skills from it, and
  `npx skills update -p -y` updates them.
- The CLI sends anonymous install counts to skills.sh. When the user wants none, set `DISABLE_TELEMETRY=1`.
- When `triage` is installed on a GitHub repo, list `gh label create` for each of `needs-triage`, `needs-info`,
  `ready-for-agent`, `ready-for-human` and `wontfix` that `gh label list` lacks, in the plan, and run them after the
  go-ahead.
- On an existing repo, suggest one whole-repo review in the hand-over: `npx skills use DietrichGebert/ponytail@ponytail-audit`
  prints a prompt for it without installing the skill.

## The "Skills" lines for AGENTS.md

Write these lines, minus the skills that were skipped and are not installed for the user either.

```markdown
- When a request leaves decisions open, interview the user with `grilling`, one question at a time. `/grill-with-docs` also records the answers.
- When a domain term or a hard-to-reverse decision settles, record it with `domain-modeling` in GLOSSARY.md or docs/adr/.
- When you design a module or an interface, use `codebase-design`.
- When a change needs tests, work test-first with `tdd`. A reference to `superpowers:test-driven-development` means `tdd`.
- When you decide how much code to write, use `ponytail`: the smallest change that fully works. Mark each deliberate shortcut with a `shortcut:` comment; `ponytail-debt` lists them.
- When something fails or a test is red, find the root cause with `systematic-debugging` before you change code.
- Before you say work is done, run the checks that prove it, as `verification-before-completion` says.
- When you write or change AGENTS.md, a doc or a skill, use `writing-for-agents`.
- When review feedback arrives, check each point with `receiving-code-review` before you act on it.
- When the work is ready, integrate the branch with `finishing-a-development-branch` and write the pull request body with `pr`.
- When the user wants to continue in another session, they run `/handoff`.
- docs/agents/ already holds the output of `/setup-matt-pocock-skills`; the user runs it again only to change the issue tracker.
```

With an issue tracker, add: "- To turn a plan into tickets, the user runs `/to-spec`, `/to-tickets` and `/triage`."

These lines carry the trigger for each skill. In one vendor evaluation a skill went unused in 56% of runs until a line
in `AGENTS.md` said when to load it, which raised its use above 95%.

## Keep the set lean

An audit asks which companion skills never run. In Claude Code, `/skill-doctor` lists the skills that were never
invoked. Propose removing each of those with `npx skills remove -s <name> -y` and deleting its `AGENTS.md` line; remove
it after the user confirms.
