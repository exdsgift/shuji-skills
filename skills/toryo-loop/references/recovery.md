# Recovery: when the loop stops

Read this when an agent, a land or the session stops before its done-when. Check GitHub before acting on what any
agent reports: its state may be stale.

| What happened | What to do |
| --- | --- |
| A usage limit stopped agents mid-run | After the reset, resume each one (SendMessage in Claude Code): "Pick up `<X>` where you stopped, same brief and rules; check your worktree with `git -C <wt> status`; reply as your brief asks." |
| The reviewer's model is refused | The brief told it to say so in one line and stop. Relaunch on the next model in the setup file's list; when none is left, on the executor's model in a fresh context, marked on the pull request and in the closing comment. |
| An agent's turn ended while its own background job ran | Tell it to read that job's output, or rerun it in the foreground, without waiting for a notification. |
| The session restarted | Read the worktrees (`git worktree list`, `git -C <wt> status`), the open pull requests and the queue; relaunch each agent from where it stopped, never from zero. |
| A land printed success but the state is not `MERGED` | No clean-up. [landing.md](landing.md#when-nothing-landed). |
| A head branch was deleted while its pull request was open | Push the local SHA back, reopen, wait for CI, land again ([landing.md](landing.md#when-nothing-landed)). |
| CI runs stay queued after an Actions outage | Close and reopen the pull request to start new runs on the same head. |
| An agent reports state that GitHub contradicts | GitHub wins: brief the agent with what GitHub shows. |
| A limit or a compaction is near | Nothing to save by hand: the state already lives in the queue, the issues, the pull requests and the worktrees, and a new session resumes from there. |
| A check is red and nobody can explain it | Stop the loop in every mode, and report the check, the run link and what was ruled out. |
