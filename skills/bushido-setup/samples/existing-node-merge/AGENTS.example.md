<!-- bushido-setup 2026-10-15: run bushido-setup again to audit this repo. -->
# slugkit

slugkit is a tiny library that turns titles into URL slugs.

## Commands

- Run one test file with `npx vitest run src/index.test.ts`.

## Precepts

1. Name top-level folders after the domain or feature they hold, within the ecosystem's standard layout. Code is found by what it does, not by its layer.
2. Give each module one decision that may change, behind a small interface over a deep implementation. A change then stays inside one module.
3. Point dependencies at the domain: domain code imports no framework, database or vendor SDK, which you wrap at the edge. The domain then outlives its tools.
4. Add a layer, an option or an interface only for a need that exists today; an interface needs a second implementation or a real boundary. A layer that only forwards calls adds cost and hides nothing.
5. Leave formatting and lint to the configured tools, which CI runs, and match the code around your change. Every file then reads the same.
6. Use the names in GLOSSARY.md and choose precise ones; when a thing is hard to name, redesign it. A vague name marks a vague design.
7. Size functions by cohesion, never by line count. Splitting a coherent function scatters its logic across names a reader must chase.
8. Comment public interfaces and the reasons the code cannot show, and delete dead code rather than commenting it out. Git keeps the history.
9. Make one logical change per commit, with the tests green after each, and commit a refactor before the behaviour change it prepares. Each commit can then be reviewed and reverted alone.
10. Keep pull requests small and single-purpose; about 100 changed lines is normal. Reviewers find more in small changes.
11. Write commit headers as Conventional Commits; when the project ships versions, use SemVer and a hand-written CHANGELOG.md. Readers learn what changed without reading the diff.
12. Ship every behaviour change with its tests, and start every bug fix with a failing test. The test proves the fix and keeps the bug out.
13. Test through public interfaces, keep tests deterministic and fast, and mock only types you own. Such tests survive a refactor.
14. Update docs/, GLOSSARY.md and docs/adr/ in the same change as the code they describe. Docs that lag the code mislead the next reader.
15. Read configuration from the environment and validate it at startup; keep every secret out of the repo. The repo must be safe to make public at any moment.

## Workflow

- Before you open a pull request, run the code review your agent provides at high effort: `/code-review high` in Claude Code, `/review` in Codex, the `code-review` skill elsewhere. Show the findings to the user and push only after their go-ahead.
- Run `npm test` before every commit.

## Skills

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

## Map

- `docs/README.md`: the index of the docs. Read it before you change behaviour a doc describes.
- `src/generated/AGENTS.md`: generated code and how to regenerate it. Read it before you change files in `src/generated/` or `scripts/codegen.mjs`.

## Agent skills

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the root, created when first needed. See `docs/agents/domain.md`.
