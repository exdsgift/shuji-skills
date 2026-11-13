# Re-check brief: pull request #87, low

Sent with SendMessage to the reviewer that ran the high review.

The head moved from `3f2a9c1` to `b7e04d5`. Review only `git diff 3f2a9c1..b7e04d5`, and skip the lines that came from
merging origin/main (`git range-diff origin/main 3f2a9c1 b7e04d5` shows which).

## The master's decision on each finding

- F1: fix; iterate over every tier, with a test for `qty=100`.
- F2 (a possible race at `pricing.py:40`, no proof): nit, filed to #12 as item 31 with what proof would settle it.
- F3: fix in this round, the rename.
- F4 (CI `unit` red): the same defect as F1; must be green on the new head.
- F5 (`legacy.py:10`): nit, filed to #12 as item 32.

## The executor's report

> Head b7e04d5. F1 fixed: `test_last_tier_applies` fails on 3f2a9c1, passes now. F4: `unit` passes locally. F3 renamed.
> Merged origin/main (no conflict). ruff 0, pyright 0, pytest 0.

## Check

- F1 is fixed, and `test_last_tier_applies` fails without the fix.
- The fix brought in no new bug, in particular at the last tier's upper bound.
- CI on `b7e04d5`, from `gh pr checks 87`.

Reply "clean", or the findings with their proof, labelled as before.
