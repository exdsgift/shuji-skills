# Re-check brief: pull request #<N>, low

Sent with SendMessage to the reviewer that ran the high review.

The head moved from `<old>` to `<new>`. Review only `git diff <old>..<new>`, and skip the lines that came from merging
origin/<default> (`git range-diff origin/<default> <old> <new>` shows which).

## The master's decision on each finding

- F1: <fix, and how> | <nit, filed to #<nits issue>> | <declined, and why>
- <one line per finding>

## The executor's report

<The executor's reply, pasted.>

## Check

- Each fixed finding is fixed, and its test fails without the fix.
- The fix brought in no new bug.
- <Anything specific to this pull request.>

Reply "clean", or the findings with their proof, labelled as before.
