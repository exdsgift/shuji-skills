# Landing: the land command, the MERGED check, recovery

Read this before landing, and whenever a land's result is unclear.

## Before the land

Refuse a pull request that is not open, is still a draft, is not based on the default branch, or has a check that is
not success, skipped or neutral. A pending check is never overridden. A red check is overridden only when it matches
the setup file's allowed-red pattern (an outside mirror that is down, for example), and the closing comment names it.

## The land

Use the setup file's land command. The default is a real merge commit, pinned to the reviewed head:

```bash
gh pr merge <N> --merge --match-head-commit <sha>
```

A repository whose own convention squashes or rebases says so in its land command. Run one land at a time when the
land command keeps state. Run a long land command in the background and read its output file; never read its status
through a pipe (`… | tail` returns tail's 0).

## The MERGED check

Chain the check to the land, and the clean-up to the check:

```bash
gh pr merge 87 --merge --match-head-commit 3f2a9c1 &&
  test "$(gh pr view 87 --json state -q .state)" = MERGED &&
  echo "87 merged"
```

Clean up only after `MERGED`. A land command that prints success while the state is `OPEN` landed nothing.

## When nothing landed

- **The default branch moved** ("the base branch was modified", "not mergeable"): run the same land command again. When
  it still fails because the head is behind and protection requires it current, send the executor a one-line brief
  to merge the default branch and push; the new head needs green CI, and a low review only when the merge touched the
  pull request's files. The master never rebases or force-pushes the head itself.
- **The head branch was deleted while the pull request was open**: push the local SHA back
  (`git push origin <sha>:refs/heads/<branch>`), `gh pr reopen <N>`, wait for CI, land again.
- **CI is queued forever** after an Actions outage: close and reopen the pull request to start new runs on the same
  head.

## The clean-up

Only after `MERGED`, remove the four things, and check that none remains:

1. the remote head branch: `git push origin --delete <branch>` (skip when GitHub already deleted it);
2. the worktree: `git worktree remove <path>`, never with `--force` over uncommitted work;
3. the local branch: `git branch -d <branch>`; use `-D` only after `git cherry origin/<default> <branch>` shows no
   `+` line. A branch carrying a patch the default branch lacks is reported, never deleted;
4. the fetched ref: `git update-ref -d refs/pull/<N>/head` or `git branch -D pr/<N>`, whichever the fetch made.
