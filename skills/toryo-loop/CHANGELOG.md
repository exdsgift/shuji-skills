# Changelog

What changed in toryo-loop, newest first. There are no version numbers: each push to `main` is a release, and
`npx skills update` or `claude plugin update shuji@shuji` brings it.

## 2026-11-13

- The guard hook reads `GIT_DIR` and `GIT_WORK_TREE` only where the shell sets them, keeps a subshell inside a
  `case` arm, and treats `~-` and `~+` as an unknown checkout. The setup file and the briefs give worktrees an
  absolute path, so `git -C <worktree> commit` passes the hook after an `eval` or a `source`.
- First version. The skill runs a coding-agent delivery loop as the master session: a queue in a GitHub issue,
  executor subagents that build each ticket in a worktree and stop at the draft pull request, a fresh reviewer on
  another model, one fix round on proved bugs, a land checked for `MERGED`, and the issues kept current.
- Three tracks (A full, B light, C mechanical), two tickets in flight at most, and three modes: autonomous, finish
  and stop, one ticket.
- A guided first run writes the repository's setup file, `docs/agents/toryo-loop.md`, the executor, executor-light
  and reviewer agent files for Claude Code, and, if wanted, a guard hook with its own self-test.
- `samples/` holds a filled setup file, one brief of each kind, a queue, a closing comment and a stop report for a
  made-up repository.
