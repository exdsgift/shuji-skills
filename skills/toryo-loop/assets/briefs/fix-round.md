# Fix round: pull request #<N>

Sent with SendMessage to the executor that built the pull request. This is the one fix round: fix these, then stop at
the push.

Ticket #<n>, worktree `<path>`, branch `<branch>`, reviewed head `<old sha>`.

## Bugs

- F<k> `<file:line>`: <what is wrong>. Proof: <input> gives <wrong output>, expected <right output>. Fix: <the
  master's decision>. Turn the probe into a test that fails before your fix.
- CI `<check>`: <the failure, from `gh run view`>.

## Nits to fix now

<Cheap nits in files this round already touches, one line each with `file:line`, or "none".>

## Decided for you

<Any design question this round raised, and the master's pick, which you build without reopening it, or "nothing".>

## Then

1. `git fetch origin`, then merge origin/<default> into the branch: a merge, never a rebase or a force-push.
2. Local checks, in the foreground: `<check commands>`.
3. Update the docs the fix touches.
4. Push, and stop.

## Reply

The new head `<sha>`; each item above: fixed (with the test that proves it) or not, and why; the checks with their exit
status.

{machine rules}
