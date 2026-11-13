Landed in #87 (merge commit `c91e2fa`): orders of 50 or more widgets now get the tier price per order line, and the
invoice names the tier. `docs/pricing.md` lists the same table.

- Track A: plan, plan review (one plan bug fixed before code: the property test now reaches the last tier), high review,
  one fix round (F1, the last tier skipped, with its test), low re-check clean.
- Reviewed on `fable`, a model other than the executor's.
- CI: `lint` and `unit` green on the landed head; no allowed-red check.
- Decided in the fix round: a quantity below 1 raises `ValueError`. Deferred in #11: "accept qty = 0 for quotes", when a
  quote feature is queued.
- Nits filed to #12: items 31 (a possible race at `pricing.py:40`, unproven) and 32 (`legacy.py:10`).

Nothing is left on this ticket: closing.
