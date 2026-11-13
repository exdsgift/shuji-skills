# Review brief: pull request #<N> (#<n> <title>, track <A | B | C>), <high | low> review

<First launch of this agent type in the session: print your exact model id on line one of your reply.> If `<model>` is
refused, say so in one line and stop.

## Setup

Read-only: edit no file, post no comment, push nothing, change no state. Fetch with
`git fetch origin <default> pull/<N>/head:pr/<N>` and read `git diff origin/<default>...pr/<N>` and `gh pr view <N>`.

## The spec

<The ticket; track A: the plan's decisions and the binding changes, or their path.>

## The executor's choices beyond the plan

<From the executor's reply, one line each, or "none".>

## Where to look hardest

- <The risk this ticket carries, named.>
- Fail-open paths; units and edge cases; the interaction with <what just landed>; what CI did not run; tests that
  cannot fail; docs against the code.

## Questions

1. <A question the master wants answered, with where to look.>

## The proof rule

A finding is bug-level only with a proof: a test that fails, a red check, or a concrete input and its wrong output.
Label every other finding a nit.

## Method

Run the code-review skill at <level>, then check each finding against the code itself. When the skill call is
declined, review by hand at the same depth and say so. Read CI with `gh pr checks <N>` and report only what `gh` shows.

## Report

Findings, most severe first, each with `file:line`, its proof and its label. Then the answers to the questions. Then
what you ran and what you did not verify. No preamble.

{machine rules}

---

## Variant: plan review (medium)

Replace "Setup" and "The spec" with:

> Read-only. Run `git fetch origin <default>`, then review the plan at `<path>` against origin/<default> at `<sha>`.
> Check every claim it makes about the code with `file:line`. Look for plan bugs: a wrong assumption, a missing edge
> case, a test that cannot fail, slices whose order makes them collide. Give your view on each decision D1..Dn: agree,
> or the option you would pick and why.

and the report's findings become plan bugs (with the `file:line` that proves each) and notes.
