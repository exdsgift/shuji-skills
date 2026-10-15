# Audit

An audit runs on a repo this skill set up, or on any repo the user asks to check. It reads, reports and proposes; it
changes a file only after the user confirms that fix.

## Steps

1. Detect, as in step 1 of the setup. Read the setup date from the marker on the first line of `AGENTS.md`.
2. Check every item in the list below and give it a verdict: **missing**, **out of line**, or **fine**.
3. Report in at most 30 lines, missing items first, then out of line, then fine as one count. Give each finding its
   file and a one-line fix.
4. Propose the fixes as a plan, the same way as step 3 of the setup, and apply the fixes the user confirms.
5. Run step 8 of the setup on what changed.

Done when every item has a verdict and every confirmed fix passes its check.

## The list

### Root AGENTS.md

- It is under 100 lines.
- The "Precepts" block matches [precepts.md](precepts.md). A difference the user made on purpose is fine; report it
  once and leave it.
- It holds none of what [agent-files.md](agent-files.md) leaves out: no overview, no directory tree, no stack
  summary, no rule a linter enforces, no general virtue.
- Its "Map" lists every nested `AGENTS.md`, and every path it names exists.
- Its "Skills" lines name exactly the installed skills, plus the process skills.
- Each rule appears once across all agent files, and no two files contradict each other.

### Instruction files

- `CLAUDE.md` holds exactly `@AGENTS.md`, at the root and beside every nested `AGENTS.md`.
- `.gemini/settings.json` lists `AGENTS.md` in `context.fileName`.
- Each nested `AGENTS.md` holds at least one rule the code does not show, and repeats nothing from the root.
- No tool-specific rule file (`.cursor/rules/`, `.claude/rules/`, `.github/instructions/`) duplicates a rule.

### Docs and memory

- `docs/README.md` lists every entry of `docs/`.
- `docs/agents/domain.md` and `LICENSE-mattpocock-skills` exist; `issue-tracker.md` exists when the user tracks work;
  `triage-labels.md` exists when `triage` is installed.
- ADRs are numbered without gaps or reuse. `GLOSSARY.md` follows its format.
- A project that ships versions has `CHANGELOG.md` with an `Unreleased` section.

### Secrets

- `.gitignore` ignores `.env` and `.env.*` and keeps `!.env.example`.
- The names in `.env.example` match the rows of `docs/secrets.md`.
- No tracked file holds a value that looks like a secret: run `gitleaks dir .` when it is installed, and say so when
  it is not.

### Skills

- `.agents/skills/` and `.claude/skills/` hold the same files, except `code-review`, which sits only in
  `.agents/skills/`.
- `skills-lock.json` lists every installed companion skill.
- Skills that never run: in Claude Code, `/skill-doctor` lists the skills never invoked. Propose removing each one, as
  [companion-skills.md](companion-skills.md) says.

### CI and repo files

- The CI workflow runs the lint, format, type and test commands and the `docs` job from [repo-files.md](repo-files.md).
- Every action is pinned to a full commit SHA.
- `.editorconfig`, `.gitattributes` and `.gitignore` exist, and `dependabot.yml` exists when the remote is on GitHub;
  `LICENSE` matches the user's choice.

### Precepts in the code

- Run the checks in the table of [precepts.md](precepts.md). They sample the repo, so name what you looked at.
