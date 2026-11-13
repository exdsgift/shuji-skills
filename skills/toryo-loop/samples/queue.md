# Map: the widgets queue

Mode: autonomous, set 2026-11-12 by the master.

In flight: #41 (PR #87, in high review) and #44 (PR #88, building).

| # | Ticket | Track | Labels | Why at this position |
| --- | --- | --- | --- | --- |
| 1 | #41 Tier pricing for bulk orders (decided, PR #87 in review) | A: changes what a price means | `area:pricing` | the sales team's quarter starts on 2026-12-01 |
| 2 | #44 CSV export of orders (building, PR #88) | B: clear, ~80 lines | `area:export` | unblocks the reporting tickets #47 and #48 |
| 3 | #42 Tiered discounts (planned) | A: core path `src/widgets/core/` | `area:pricing` | Blocked by: #41 |
| 4 | #43 Round prices to cents at each line | A: changes what a price means | `area:pricing` | shares `pricing.py` with #41: waits for it to land |
| 5 | #45 Typo in the README install section | C: docs | `area:docs` | cheap, after the pricing work |
| 6 | #47 Export filters by date (ready to build) | B: clear, ~60 lines | `area:export` | needs #44's writer |

**Waiting for the operator:** #49 Which currencies to support first (decision batch #20, D1).

**Deferred:** see #11; one trigger is close: "accept qty = 0 for quotes" when a quote feature is queued.

**Beside the queue:** #39 dependency bump, opened by a bot, landed by the operator.

**Needs hardware:** none.
