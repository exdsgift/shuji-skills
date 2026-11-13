# Plan brief: #<n> <title> (track A)

This turn: the plan only. Write no code and open no branch.

<First launch of this agent type in the session: print your exact model id on line one of your reply.>

## The ticket

<The issue's text, or: read it with `gh issue view <n> --comments`.>

## State on origin/<default>

<The commit the plan starts from, and what just landed that touches this ticket.>

## Decisions in force

<The operator's and the master's decisions that bind this ticket, each with where it was taken (issue, comment).>

## Read first

<Files, docs and decision records the plan depends on.>

## Work in flight

<The other ticket in flight, its pull request and its files. Every overlap with this ticket, named: `<file>` (hot file,
registry, shared test).>

## The plan answers

1. Each open choice: the options, the cost and risk of each, and one recommendation.
2. The edge cases: <the ones the master already sees>, and any you find.
3. What a number or a verdict means before and after, where the ticket changes one.
4. The files to change, and the files left alone.
5. The tests: inputs and expected outputs for each; a property test where a value is computed.
6. The size besides tests. Past <PR cap> lines, the slices: each with its files, its tests and its size, ordered so
   the slices that share fewest files come first.
7. The decisions left for the operator, if any.

## Output

Write the plan to `<scratchpad>/plan-<n>.md`. Reply in one paragraph: its path, the slices, and the decisions D1..Dn,
each with your pick.

{machine rules}
