# Fix round: pull request #87

Sent with SendMessage to the executor that built the pull request. This is the one fix round: fix these, then stop at
the push.

## Bugs

- F1 `src/widgets/pricing.py:88`: the loop stops one tier early. Proof: `price_for(qty=100)` gives 9.00, expected 8.50
  from the table at `pricing.py:12`. Fix: iterate over every tier, including the last. Turn the probe into a test that
  fails before your fix.
- CI `unit`: `tests/test_pricing.py::test_bulk_order` fails with `AssertionError: 9.0 != 8.5` (the same defect as F1;
  it passes once F1 is fixed).

## Nits to fix now

- F3 `src/widgets/pricing.py:91`: rename `tmp2` to `tier_floor`.

## Decided for you

- `price_for(qty=0)` raises `ValueError`, as you built it: it fails loudly and is easy to relax later. The deferred
  issue #11 holds "accept qty = 0 for quotes" with its trigger.

## Then

1. Merge origin/main into the branch: a merge, never a rebase or a force-push.
2. Local checks, in the foreground: `uv run ruff check`, `uv run pyright`, `uv run pytest -q`.
3. Update the docs the fix touches.
4. Push, and stop.

## Reply

The new head `<sha>`; each item above: fixed (with the test that proves it) or not, and why; the checks with their exit
status.

{machine rules}
- The shell is zsh on macOS: BSD `sed -i` needs an empty suffix (`sed -i ''`); `gsed` is the GNU one.
- `uv` lives in `~/.local/bin`, which a non-login shell may not have on `PATH`.
