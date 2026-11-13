# Plan brief: #41 Tier pricing for bulk orders (track A)

This turn: the plan only. Write no code and open no branch.

Print your exact model id on line one of your reply.

## The ticket

Read it with `gh issue view 41 --comments`. In short: orders of 50 or more widgets get the tier price from the table in
`src/widgets/pricing.py`, instead of the unit price; the invoice shows which tier applied.

## State on origin/main

`a41c0d2`. #38 (currency rounding) landed yesterday and touched `src/widgets/core/money.py`, which `price_for` calls.

## Decisions in force

- Prices are `Decimal`, rounded half-up to cents, only at the invoice total (#38, closing comment).
- Tier boundaries are inclusive at the lower end (operator, decision batch #20, D2).

## Read first

- `src/widgets/pricing.py`, `src/widgets/core/money.py`, `tests/test_pricing.py`
- `docs/pricing.md` (the tier table as customers see it)

## Work in flight

- #44 CSV export of orders, PR #88, building: `src/widgets/export.py`, `tests/test_export.py`, `changelog.d/44.md`. No
  overlap with this ticket except `changelog.d/`, a one-file-per-entry registry.

## The plan answers

1. Each open choice, with options, cost and risk, and one recommendation. Known: does a tier apply per order line or
   per order total?
2. Edge cases: quantity 0 and negative, exactly 50, the last tier's upper bound, a tier table that is not sorted.
3. What the invoice total means before and after, for an order that crosses a boundary.
4. The files to change, and the files left alone (`src/widgets/registry.py` is a hot file).
5. The tests: inputs and expected outputs for each; a property test that the price never rises with quantity.
6. The size besides tests. Past 400 lines, the slices.
7. The decisions left for the operator, if any.

## Output

Write the plan to `<scratchpad>/plan-41.md`. Reply in one paragraph: its path, the slices, and the decisions D1..Dn,
each with your pick.

{machine rules}
- The shell is zsh on macOS: BSD `sed -i` needs an empty suffix (`sed -i ''`); `gsed` is the GNU one.
- `uv` lives in `~/.local/bin`, which a non-login shell may not have on `PATH`.
