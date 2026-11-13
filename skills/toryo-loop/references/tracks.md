# Tracks: classifying, sizing, slicing

Read this at the classify step when a ticket's track is not obvious, or when a ticket is past the PR cap.

## Classifying

Check the A reasons first; any one of them makes the ticket A, however small its diff:

1. It touches a core path listed in the setup file.
2. It changes what a number or a verdict means: a formula, a rounding, a threshold, a default, a schema, a status a
   user reads.
3. It has an open design choice: two reasonable options and nobody has picked.
4. It runs past the B size (default about 100 lines besides tests).

Then:

- **B** when none of the A reasons holds and the fix is clear: the ticket or the issue says what is wrong and what
  right looks like.
- **C** when the change has no logic: docs, config values that change no behaviour, a rename, links, labels. A
  config value that changes behaviour is B or A.

Write the reason beside the track in the queue row ("A: core path", "B: clear, ~30 lines").

## Sizing

Count lines added and removed besides tests: `git diff --stat origin/<default>...` for a branch, or the plan's
estimate for a ticket not built yet. Generated files and lock files do not count; say so when you leave them out.

## Moving a ticket to A

When a B or C executor meets a design choice, or more work than its track allows, it stops and says so in its reply.
The master moves the ticket to A in the queue and starts the plan. When the plan and the code already exist, skip
the plan review and go to the high review.

## Slicing

A ticket past the PR cap (default about 400 lines besides tests) is cut into slices at the plan step. Each slice
lists its files, its tests with inputs and expected outputs, and its size; order the slices so the ones with fewest
shared files come first. Each slice is one pull request, `Part of #<n>`, and the issue closes with the last one.

## Bugs found on the way

A bug that a review finds outside the pull request's scope becomes its own ticket. It jumps the queue only when it
touches a core path; every other bug or chore goes to the queue's end, where similar ones are batched into one ticket.
