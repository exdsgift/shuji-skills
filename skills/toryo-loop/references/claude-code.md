# Claude Code: agents, effort, resuming, the guard hook

Claude Code is the reference harness. Read this when writing the agent files at the first run, launching an agent, or
installing the guard hook.

## The agent files

The first run copies [../assets/agents/](../assets/agents/) to `.claude/agents/`, filling each `model:` from the setup
file:

| File | Model | Tools |
| --- | --- | --- |
| `executor.md` | the strongest model | `Bash, Read, Edit, Write, Skill, ToolSearch` |
| `executor-light.md` | a cheaper model | `Bash, Read, Edit, Write, Skill, ToolSearch` |
| `reviewer.md` | a model other than the executor's | `Bash, Read, Skill, ToolSearch, Agent` (the code-review skill starts its own subagent) |

- Launch each by its `subagent_type` (`executor`, `executor-light`, `reviewer`), never as a general-purpose agent.
- **The probe:** the first launch of each type in a session asks it to print its exact model id on line one. Check it
  against the setup file before trusting the type.
- **Loading:** a session reads `.claude/agents/` when it starts, so a new or changed definition loads only in the next
  session, and only from a checkout whose branch has the files.

## Effort

The proved defaults: executor medium; reviewer high for track A, medium for B and plan reviews, low for C. Pass
`effort` in each launch, since a running session cannot change its own; the frontmatter value is only the default.

## Cache

The executors keep `experimental.cacheTtl: 1h` in their frontmatter: they pause between tool calls long enough for a
5-minute cache to expire. The reviewer stays at the default 5 minutes: on a premium model the 1-hour write premium
cancels the saving. An agent left waiting on CI rewrites its whole context cache after 5 idle minutes, which is why
the executor stops at the push.

## Resuming

`SendMessage` to an agent's id continues it with its context. The fix round goes to the executor that built the pull
request; the low re-check goes to the reviewer that ran the high review; a usage-limit recovery resumes each stopped
agent ([recovery.md](recovery.md)).

## Background work

Run a long command (the land command, a slow suite on the master's side) with `run_in_background` and read its output
file when notified. Agents run their checks in the foreground. Never read an exit status through a pipe.

## The guard hook

[../assets/guard-hook.sh](../assets/guard-hook.sh) is a `PreToolUse` hook on `Bash`. Copy it to
`.claude/hooks/toryo-guard.sh` and register it in `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "bash \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/toryo-guard.sh" }]
      }
    ]
  }
}
```

It refuses, with its reason:

- a `git commit` whose checkout is on the default branch: the session checkout stays on it, and commits go to a
  worktree with `git -C <worktree> commit`;
- a `git worktree add` past the setup file's `Worktree cap:`;
- a command matching a line of the setup file's ` ```guard ` block, written `<extended regex> :: <reason>`.

It matches words anywhere in the command, so pull request, issue and commit text goes through `--body-file` or `-F`.
It needs `python3` or `jq` to read the hook input. `bash .claude/hooks/toryo-guard.sh --self-test` checks it in a
throwaway repository and ends with `self-test: clean`.
