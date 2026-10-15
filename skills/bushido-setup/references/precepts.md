# Precepts

The fifteen precepts are the fixed core of every repo this skill sets up. They come from the classic programming
manuals, and where the manuals disagree they follow the side that keeps modules deep and code lean (Ousterhout and
McConnell over very small functions). Style that a formatter, linter or type checker enforces is never a precept: the
tools in [ecosystems.md](ecosystems.md) carry it.

## The block for AGENTS.md

Copy this block into the root `AGENTS.md` word for word. A repo whose user changed it keeps the user's version; the
audit reports the difference and leaves it.

```markdown
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
```

## How the audit checks each precept

An audit samples the repo; it does not prove a precept holds everywhere. Report what you looked at.

| # | Check |
| --- | --- |
| 1 | Top-level source folders named after layers (`controllers/`, `models/`, `utils/`, `helpers/`) where the ecosystem does not require them. |
| 2 | Modules whose public surface is about as large as their code; one format or schema parsed in more than one module. |
| 3 | Imports of a framework, ORM or vendor SDK from the domain folders. |
| 4 | Interfaces or abstract classes with one implementation and no boundary; functions that only forward their arguments. |
| 5 | CI runs the formatter check and the linter; the tools' configs exist. |
| 6 | Terms in code or docs that GLOSSARY.md lists under `_Avoid_`. |
| 7 | No check: function length alone proves nothing. |
| 8 | Commented-out code blocks; public functions without an interface comment where the ecosystem expects one. |
| 9 | The last 20 commits (`git log --oneline -20`): a commit mixing a refactor with a behaviour change, or a commit that leaves tests red. |
| 10 | The last 10 merged pull requests (`gh pr list --state merged --limit 10 --json additions,deletions`): changes far above 400 lines. |
| 11 | Commit headers that are not Conventional Commits; a project that ships versions with no CHANGELOG.md or no `Unreleased` section. |
| 12 | Recent behaviour changes with no test change in the same commit or pull request. |
| 13 | Tests that call the network or the clock without a fake, or mock a third-party type directly. |
| 14 | Code changes in the last 20 commits whose docs, glossary or ADR did not change while the behaviour they describe did. |
| 15 | Configuration read outside one module; values that look like secrets in tracked files (`gitleaks dir .` when installed). |
