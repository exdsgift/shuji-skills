# Review brief: pull request #87 (#41 Tier pricing for bulk orders, track A), high review

Print your exact model id on line one of your reply. If `fable` is refused, say so in one line and stop.

## Setup

Read-only: edit no file, post no comment, push nothing, change no state. Fetch with
`git fetch origin main pull/87/head:pr/87` and read `git diff origin/main...pr/87` and `gh pr view 87`.

## The spec

Issue #41; the decisions D1 (per order line) and D2 (tiers sorted at load), and the plan review's B1 and N1, are on
#41's comment of 2026-11-12.

## The executor's choices beyond the plan

- It made `price_for` raise `ValueError` for a quantity below 1 (the plan did not say).

## Where to look hardest

- The tier boundaries: inclusive at the lower end, and the last tier's upper bound.
- The interaction with #38's rounding in `src/widgets/core/money.py`: rounding happens only at the invoice total.
- Fail-open paths: an empty or unsorted tier table.
- What CI did not run: `docs/pricing.md` against the code's table.
- Tests that cannot fail: a property test whose generator never reaches a boundary.

## Questions

1. Does any caller of `price_for` pass a quantity of 0 today (`grep -rn "price_for(" src/`)?

## The proof rule

A finding is bug-level only with a proof: a test that fails, a red check, or a concrete input and its wrong output.
Label every other finding a nit.

## Method

Run the code-review skill at high, then check each finding against the code itself. When the skill call is declined,
review by hand at the same depth and say so. Read CI with `gh pr checks 87` and report only what `gh` shows.

## Report

Findings, most severe first, each with `file:line`, its proof and its label. Then the answers to the questions. Then
what you ran and what you did not verify. No preamble.

{machine rules}
- The shell is zsh on macOS: BSD `sed -i` needs an empty suffix (`sed -i ''`); `gsed` is the GNU one.
- `uv` lives in `~/.local/bin`, which a non-login shell may not have on `PATH`.
