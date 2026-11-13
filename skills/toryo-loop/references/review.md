# Review: the proof rule, nits, the fix round, the re-check

Read this before launching a review, and again when a report comes back.

## The review

- One fresh-context reviewer per pull request, and one high review per pull request, launched at the push. Track C
  gets one low review instead.
- The reviewer runs the code-review skill at the level its brief names, then checks each finding against the code
  itself. When the skill call is declined, it reviews by hand at the same depth and says so.
- It reads CI with `gh pr checks <N>` and `gh run view`, and reports only what `gh` shows.
- The brief names where to look hardest: fail-open paths, units and edge cases, the interaction with what just
  landed, what CI did not run, tests that cannot fail, and docs against the code.
- When code and docs disagree, the code is the truth: the fix updates the doc in the same change, or the gap is filed.
- A rebase or default-branch merge whose `git range-diff` shows only the default branch's lines gets no review.
- What only real hardware or a live service can show is built minimal and tested offline; its live check goes into
  the setup file's offline-check registry. A hypothetical case gets no review round.

## The report

Findings most severe first, each with `file:line`, its proof, and its label: **bug-level** or **nit**. Then the
answers to the brief's questions, then what the reviewer ran and what it did not verify. No preamble.

## Sorting the findings

| A finding with | Is | Goes |
| --- | --- | --- |
| a test that fails, a red check, or a concrete input and its wrong output | bug-level | the fix round, fixed without asking |
| a claim with no proof ("may race", "could overflow") | nit | the nits issue |
| a nit under five minutes, in a file the round already touches | nit | the fix round, as a cheap extra |
| any other nit, including one in a file the pull request does not touch | nit | the nits issue, at once |

Bug-level covers correctness, security, data loss and a broken contract. A finding the reviewer could not prove is a
nit for this pull request; when it would be serious if true, it is also a line in the nits issue saying what proof
would settle it. Nits never open a round.

## The fix round

One round, through the fix-round brief, sent to the same executor:

- every bug-level finding and every red check together, each with `file:line`, its probe, and the master's decision
  on the fix ("turn each probe into a test that fails before your fix");
- the cheap nits in touched files;
- then: merge the default branch, run the local checks in the foreground, update the docs, push, stop, and reply with
  the new head and what each item became.

A design question inside the round is the master's: it picks the simplest safe option (the one that fails loudly,
hides nothing and is easy to change later), writes it into the brief and on the issue, and sends a "for now X, later
Y" line to the deferred issue when a better option waits. The round asks the operator nothing.

## The low re-check

SendMessage to the reviewer that ran the high review, through the re-check brief: the head moved from `<old>` to
`<new>`; review `git diff <old>..<new>` only, skipping the default branch's merged lines; check each finding against the
master's decision. It replies "clean", or the findings with their proof. A bug it proves gets one more small fix and a
re-check of that commit alone.

## The deep audit

At a moment the operator calls crucial (before a release, after a large batch), run several independent fresh
reviewers over everything merged since the last audit. Check each finding against the default branch; each fix comes
with a test that fails there.
