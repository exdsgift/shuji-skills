# Build brief: #41 Tier pricing for bulk orders (track A)

## The ticket

Read it with `gh issue view 41 --comments`. The plan is at `<scratchpad>/plan-41.md`; this brief overrides it where they
differ.

## Decisions taken

- D1: a tier applies per order line, not per order total (master; summary on #41).
- D2: tiers come from the table at `src/widgets/pricing.py:12`, sorted at load time.

## Binding changes from the plan review

- B1: the plan's property test only covered quantities below 100; extend it to the last tier's upper bound and beyond.
- N1: `docs/pricing.md` lists the tiers too; update it in the same pull request.

## What changed since the plan

Nothing on origin/main touches these files.

## Files not to touch

`src/widgets/registry.py`, `tests/conftest.py`, `src/widgets/export.py`, `tests/test_export.py`. When you need one of
them, stop and say so before editing it.

## House rules

- Use the `acme-style` skill.
- Commits: conventional commits, ending with `Co-Authored-By: <agent> <noreply@example.com>`.
- Pull request body: the template at `.github/PULL_REQUEST_TEMPLATE.md`; never set the labels `release` or `security`.
- No customer name or API key in a test fixture; `data/` is never removed.

## Steps

1. Worktree, from a fresh fetch:
   `git fetch origin && git worktree add ~/src/wt/widgets/tier-pricing -b feat/tier-pricing origin/main`.
2. Tests first, in `tests/test_pricing.py`: `price_for(qty=49)` is the unit price, `price_for(qty=50)` the first tier,
   `price_for(qty=100)` 8.50, and the property test from B1. Each fails on origin/main. Commit and push.
3. The change in `src/widgets/pricing.py`. Commit and push after each step, with
   `git -C ~/src/wt/widgets/tier-pricing commit`.
4. Local checks, in the foreground: `uv run ruff check`, `uv run pyright`, `uv run pytest -q`. Each exits 0 on the head.
5. Docs and changelog: `docs/pricing.md`, and `changelog.d/41.md` (a minor bump: a price changes meaning).
6. Draft pull request: `gh pr create --draft --base main --title "feat(pricing): tier prices for bulk orders"
   --body-file <file> --label agent`. The body's first line is `Opened by an agent (toryo-loop).`; it says
   `Closes #41`.
7. Stop at the push. CI and the review are the master's.

## Reply

- Pull request #<number>, head `<sha>`.
- The local checks, each with its exit status.
- One line per step and per decision above: done, or not verified and why.
- Any choice you made that this brief did not settle.

{machine rules}
- The shell is zsh on macOS: BSD `sed -i` needs an empty suffix (`sed -i ''`); `gsed` is the GNU one.
- `uv` lives in `~/.local/bin`, which a non-login shell may not have on `PATH`.
