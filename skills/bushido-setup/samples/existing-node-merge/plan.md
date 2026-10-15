# bushido-setup plan for slugkit

## What I found

- Ecosystem: TypeScript, npm (`package.json`, `package-lock.json`). A Node library that ships its TypeScript sources
  (`"main": "src/index.ts"`, `"type": "module"`). Tests: Vitest (`npm test`). No `tsconfig.json`, no linter, no
  formatter.
- Agent files: `CLAUDE.md` at the root, `.cursor/rules/style.mdc`. No `AGENTS.md`, `GEMINI.md`, Copilot file or nested
  agent files.
- Cross-cutting files: `README.md` (has content), `LICENSE` (MIT, 2026 Ada Rossi), `.gitignore` (`node_modules/`). No
  `.editorconfig`, `.gitattributes`, CI, `docs/` or `.env*` files.
- Companion skills at user scope: none.
- Git remote: none.

Your answers: Node library `slugkit`; you maintain it and outside contributors send pull requests; no secrets; keep
the existing license; no issue tracker; nothing to add beyond the existing `CLAUDE.md`.

## The repo after setup

```
slugkit/
├── .agents/skills/                         create (by run 1-4 below)
├── .claude/skills/                         create (by run 1, 3, 4; no code-review)
├── .cursor/rules/style.mdc                 merge: its one rule contradicts precept 7; the file is removed (see merge plan)
├── .editorconfig                           create: LF, UTF-8, indent 2 spaces
├── .gemini/settings.json                   create: Gemini CLI reads AGENTS.md
├── .gitattributes                          create: LF everywhere, CRLF for .bat/.cmd/.ps1
├── .github/workflows/ci.yml                create: code job (npm ci, npm test); docs job (lychee, agent-file checks)
├── .gitignore                              append: .env, .env.*, !.env.example under "# bushido-setup"
├── AGENTS.md                               create: commands, 15 precepts, workflow, skills, map (about 60 lines)
├── CHANGELOG.md                            create: Keep a Changelog, with an Unreleased section (the package ships versions)
├── CLAUDE.md                               merge: lines move out (see merge plan); the file becomes "@AGENTS.md"
├── CONTRIBUTING.md                         create: setup, how to propose a change, AGENTS.md holds the precepts
├── LICENSE                                 skip
├── README.md                               merge: append the history and the layout paragraph from CLAUDE.md
├── docs/
│   ├── README.md                           create: index of docs/
│   └── agents/
│       ├── LICENSE-mattpocock-skills       create
│       └── domain.md                       create
├── package.json                            skip
├── package-lock.json                       skip
├── scripts/codegen.mjs                     skip
├── skills-lock.json                        create (by run 1-4)
└── src/
    ├── generated/
    │   ├── AGENTS.md                       create: never edit by hand; change scripts/codegen.mjs and run npm run codegen
    │   ├── CLAUDE.md                       create: "@AGENTS.md"
    │   └── tables.ts                       skip
    ├── index.test.ts                       skip
    └── index.ts                            skip

run 1-4: the four `npx skills add` commands below
run 5: npm ci, then the verify checks
```

### Optional (applied only when you name them)

- **optional** `tsconfig.json` (`noEmit`, `allowImportingTsExtensions`, `strict`, `module: nodenext`) and
  `npx tsc --noEmit` in CI. TypeScript is a dev dependency, but nothing runs a type check today.
- **optional** Biome as formatter and linter: `npm i -D @biomejs/biome`, `biome.json` excluding `.agents` and
  `.claude`, `npx biome ci` in CI. It would run in check mode only; existing code is never reformatted.
- **optional** `LICENSE`: the MIT text stops at "...", so the grant is incomplete. Replace the body with the full MIT
  text (`gh api licenses/mit --jq .body`), keeping "2026 Ada Rossi".

### Left out, and why

- `.github/dependabot.yml`: there is no GitHub remote.
- `.env.example`, `docs/secrets.md`, `.claude/settings.json` deny rules: no secrets.
- `docs/agents/issue-tracker.md`, `to-spec`, `to-tickets`, `triage`, `docs/agents/triage-labels.md`: no issue tracker.
- `GLOSSARY.md`, `docs/adr/`, process skills: you described no domain terms, decisions or processes.
- `.github/copilot-instructions.md`: you named no Copilot IDE chat.

## Merge plan

### CLAUDE.md

| Line | Goes to |
| --- | --- |
| `# slugkit` | `AGENTS.md`: the H1 |
| "slugkit is a tiny library that turns titles into URL slugs." | `AGENTS.md`: the one-sentence description |
| "It started as a helper inside our blog engine and was split out in 2025 so other projects could use it." | `README.md`: history is for people |
| "It has no runtime dependencies and ships TypeScript sources." | `README.md`: an overview for users of the package |
| "The main entry point is src/index.ts, which exports slugify." | `README.md`, "Development" paragraph: an overview for people |
| "Replacement tables live in src/generated and are built from scripts/codegen.mjs." | `README.md`, "Development" paragraph; the rule part goes to `src/generated/AGENTS.md` |
| "Tests use Vitest and live next to the code." | `README.md`, "Development" paragraph |
| "Run npm test before every commit." | `AGENTS.md`, Workflow |
| "Never edit src/generated/ by hand, run npm run codegen." | `src/generated/AGENTS.md` (with `src/generated/CLAUDE.md`), listed in the `AGENTS.md` map |
| "Use 2-space indentation." | `.editorconfig` (`indent_size = 2`); no prose line |
| "Keep functions under 20 lines." | Nowhere: contradicts precept 7 (see below) |
| "Prefer small commits." | Nowhere: precepts 9 and 10 keep it |

After the move, `CLAUDE.md` holds one line: `@AGENTS.md`.

### .cursor/rules/style.mdc

| Line | Goes to |
| --- | --- |
| "Keep functions under 20 lines." (`alwaysApply: true`) | Nowhere: contradicts precept 7 (see below) |

The file then holds no rule, so it is removed. Cursor reads `AGENTS.md` and the nested `src/generated/AGENTS.md`.

### Contradictions

| Existing version | Precept version | Proposed |
| --- | --- | --- |
| "Keep functions under 20 lines." (`CLAUDE.md`, `.cursor/rules/style.mdc`) | Precept 7: "Size functions by cohesion, never by line count. Splitting a coherent function scatters its logic across names a reader must chase." | The precept. To keep the 20-line limit instead, say so: it then goes in the `AGENTS.md` Workflow and precept 7 is edited to match. |

## Companion skills to install

None is installed for you at user scope, so all of them are installed at project scope, as real copies:

```bash
DISABLE_TELEMETRY=1 npx skills@latest add mattpocock/skills --copy -y -a claude-code codex cursor github-copilot gemini-cli \
  -s setup-matt-pocock-skills pr writing-for-agents grilling grill-with-docs domain-modeling codebase-design tdd handoff
DISABLE_TELEMETRY=1 npx skills@latest add mattpocock/skills --copy -y -a codex cursor github-copilot gemini-cli -s code-review
DISABLE_TELEMETRY=1 npx skills@latest add DietrichGebert/ponytail --copy -y -a claude-code codex cursor github-copilot gemini-cli \
  -s ponytail ponytail-debt
DISABLE_TELEMETRY=1 npx skills@latest add obra/superpowers --copy -y -a claude-code codex cursor github-copilot gemini-cli \
  -s verification-before-completion systematic-debugging receiving-code-review finishing-a-development-branch
```

`to-spec`, `to-tickets` and `triage` are left out: you track work in no issue tracker. No plugin and no hook is
installed.

## Commands that write to a remote

None: the repo has no remote, and `triage` is not installed, so no `gh label create` is needed.
