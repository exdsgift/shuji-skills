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

[../assets/guard-hook.py](../assets/guard-hook.py) is a `PreToolUse` hook on `Bash`; it needs `python3`. Copy it to
`.claude/hooks/toryo-guard.py` and register it in `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "python3 \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/toryo-guard.py" }]
      }
    ]
  }
}
```

It splits the command the way the shell does (quotes, `&&`, `;`, newlines, line continuations, subshells, keywords
such as `if` and `do`, `cd` and `pushd`, `git -C`, `~` and the variables it can see), reads a heredoc body as data,
not as commands, and refuses, with its reason:

- a `git commit` whose checkout is on the default branch: the session checkout stays on it, and commits go to a
  worktree with `git -C <worktree> commit`. A commit whose checkout it cannot tell (a `-C` given by a variable, a
  `$(...)` or backticks it cannot expand) is refused too: write the path out;
- a `git worktree add` past the setup file's `Worktree cap:`;
- a simple command matching a line of the setup file's ` ```guard ` block, written `<Python regex> :: <reason>`. Each
  pattern is matched against one command at a time, between `&&`, `;` and `|`.

It reads the setup file of the session's project (`$CLAUDE_PROJECT_DIR`). A guard line it cannot use, or input it
cannot read, gives exit 1: the command runs and the operator sees the message. It reads the command's words, so it
catches slips, not an agent set on getting round it. A guard pattern also sees quoted text, such as a commit message:
pass long text with `--body-file` or `-F`. `python3 .claude/hooks/toryo-guard.py --self-test` checks it in a
throwaway repository and ends with `self-test: clean`.
