# Trials: changing the loop itself

Read this when someone wants to change how the loop runs: a model, an effort, a step, a threshold. A change to the
loop follows this protocol, and the operator picks.

## The protocol

1. Change one knob, for the next N tickets (default five to eight). Write the open trial in the setup file's Trials
   section: the knob, the old and new value, the tickets it covers.
2. Measure billed spend per agent and per ticket, not context size: an agent's final context is about 80 times
   smaller than what it spent. Measure also fix rounds per ticket and bug-level findings per high review.
3. Stop at once when bug-level findings or fix rounds rise.
4. Close with one line in the Trials section: kept, changed or dropped, with the numbers.

## The defaults the trials proved

- **Executors at medium effort:** executor spend fell by about 40 % and ticket spend by about 20 %, with the same fix
  rounds.
- **A plan for track A only:** across seven plans, every plan review changed its plan and three caught a bug before any
  code, yet every pull request still needed a fix round, so a plan does not pay on light tickets.
- **Kept on the evidence:** a fresh reviewer on another model; the proof rule with one fix round; the low re-check;
  no best-of-n; the PR cap.
- **Declined:** restarting the master past about 200k tokens of context.
