# Trackers: the queue, deferred, nits, decisions, the mirror

Read this when a ticket starts (step 2) and when it lands (step 18). The backend is GitHub Issues through `gh`; a
second tracker is a **mirror**. A filled queue and a closing comment are in [../samples/](../samples/).

## The queue

A table in the map issue, the one place the order lives:

```markdown
| # | Ticket | Track | Labels | Why at this position |
| --- | --- | --- | --- | --- |
| 1 | #44 CSV export of orders (ready to build) | B: clear, ~80 lines | `area:export` | unblocks the reporting tickets |
```

- The ticket cell carries its state: planned, decided, ready to build, slices landed (2/3).
- Under the table, short lists: **waiting for the operator** (with the decision issue), **deferred** (a pointer to
  the deferred issue), **beside the queue** (work in flight outside it), **needs hardware**.
- A landed row leaves the table. Edit the map issue body with `gh issue edit <map> --body-file <file>`.
- Blocking uses GitHub's issue dependencies, or a `Blocked by: #<n>` line in the issue body as a fallback.
- An issue overtaken by another is closed as not planned, with a comment naming its successor.

## The deferred issue

Every "for now X, later Y" from a plan, a review or a decision gets a line at the moment it is decided:

```markdown
| What we do now | The later improvement | When to come back (trigger) | Source |
| --- | --- | --- | --- |
| qty <= 0 raises ValueError | accept qty = 0 for quotes | a quote feature is queued | PR #87 fix round |
```

When a trigger fires, the line becomes a queue ticket. A done or dropped line is struck through with its reason.

## The nits issue

A rolling issue: numbered items, each with `file:line` and one sentence. A cleanup pull request takes at most ten
items a week; an item older than four weeks is closed as won't fix. A nit filed on a ticket that is about to close also
goes here.

## The decision batch issue

One section per decision: the context, the options with the cost and risk of each, the recommendation, and the
tickets it unblocks. The operator answers when they call for it; a decided batch is closed, and the next decision
opens a new batch with the setup file's decision label.

## Closing a ticket

On each issue the pull request served, comment what landed and what is left, then close the issue when nothing is
left. The comment names the pull request, the review rounds, any allowed-red check, any reviewer fallback to the
executor's model, and where the deferred lines and nits went.

## The mirror

The setup file names it (a Jira project or another tracker, for example) and its sync traps. Copy state into it after
GitHub, at each step that changes state, with the connector the session has. "Fixes #N" in a pull request does not
move the mirror: set it by hand.

## Plans and briefs

They live in the session's scratchpad, which does not outlast the session. Their summaries and the decisions go on
the issue, so a new session resumes from GitHub.
