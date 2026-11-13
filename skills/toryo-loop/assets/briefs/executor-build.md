# Build brief: #<n> <title> (track <A | B>)

<First launch of this agent type in the session: print your exact model id on line one of your reply.>

## The ticket

<The issue's text, or: read it with `gh issue view <n> --comments`. Track A: the plan at `<path>`.>

## Decisions taken

<A: D1..Dn as decided, each in one line. B: "none open".>

## Binding changes from the plan review

<A: B1.. (bugs in the plan) and N1.. (notes), each one line. B: none.>

## What changed since the plan

<What landed on origin/<default> since, and what it means for this ticket, or "nothing".>

## Files not to touch

<The hot files, and the files of the ticket in flight beside this one.> When you need one of them, stop and say so
before editing it.

## Steps

1. Worktree: `git worktree add <worktree root>/<short> -b <type>/<short> origin/<default>`.
2. Tests first: <the tests, with inputs and expected outputs>. Each fails on origin/<default>. Commit and push.
3. The change. Commit and push after each step, with `git -C <worktree> commit`.
4. Local checks, in the foreground: `<check commands>`. Each exits 0 on the head.
5. Docs and changelog: <the setup file's convention>.
6. Draft pull request:
   `gh pr create --draft --base <default> --title "<title>" --body-file <file> --label <agent label>`.
   The body's first line is `<agent marker>`; it says `Closes #<n>` (or `Part of #<n>` for a slice)<; it carries a
   diagram when the change alters calls, states, a schema or an interface>.
7. Stop at the push. CI and the review are the master's.

## Reply

- Pull request #<number>, head `<sha>`.
- The local checks, each with its exit status.
- One line per step and per decision above: done, or not verified and why.
- Any choice you made that this brief did not settle.

{machine rules}
