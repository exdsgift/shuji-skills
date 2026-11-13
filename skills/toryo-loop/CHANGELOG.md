# Changelog

What changed in toryo-loop, newest first. There are no version numbers: each push to `main` is a release, and
`npx skills update` or `claude plugin update shuji@shuji` brings it.

## 2026-11-13

- The guard hook no longer follows `cd`: when a command has a `cd`, `pushd`, `popd`, `eval`, `source` or `.`
  anywhere, a commit without an absolute `git -C` is refused, and the hook expands only `~` and `$HOME`. It counts
  `GIT_DIR` and `GIT_WORK_TREE` only where the shell sets them (`readonly` and `local` included). The setup file and
  the briefs give worktrees an absolute path, one root per repository, so `git -C <worktree> commit` always passes.
- First version. The skill runs a coding-agent delivery loop as the master session: a queue in a GitHub issue,
  executor subagents that build each ticket in a worktree and stop at the draft pull request, a fresh reviewer on
  another model, one fix round on proved bugs, a land checked for `MERGED`, and the issues kept current.
- Three tracks (A full, B light, C mechanical), two tickets in flight at most, and three modes: autonomous, finish
  and stop, one ticket.
- A guided first run writes the repository's setup file, `docs/agents/toryo-loop.md`, the executor, executor-light
  and reviewer agent files for Claude Code, and, if wanted, a guard hook with its own self-test.
- `samples/` holds a filled setup file, one brief of each kind, a queue, a closing comment and a stop report for a
  made-up repository.
