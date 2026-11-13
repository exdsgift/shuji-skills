# The first run, and the setup file

Read this when the repository has no `docs/agents/toryo-loop.md`, or when the setup file lacks a knob a step needs.
The first run starts no ticket: it ends when the operator starts a new session.

## The walk

1. **Say it is a first run.** One line to the operator: there is no setup file, so the loop is set up first and no
   ticket starts in this session.
2. **Read what the repository already says**, so each knob comes with a proposed value: the default branch and its
   protection (`gh repo view --json defaultBranchRef`, `gh api repos/<owner>/<repo>/branches/<branch> -q .protected`;
   the protection rules need admin rights, so a `404` there means ask), the check commands (the CI workflows,
   `CONTRIBUTING.md`, `AGENTS.md`), the changelog convention, the labels (`gh label list`), open issues that look like a
   queue or a backlog.
3. **Ask the knobs once**, one group per message, in the order of the table below. Each knob carries the proposed
   value; the operator confirms or corrects it. A knob the operator leaves open takes the default and is marked
   `(default)` in the file.
4. **Create the missing tracker issues**, after the operator's yes: the map issue holding the queue, the deferred
   issue and the nits issue, from the shapes in [trackers.md](trackers.md), and the agent, decision and in-progress
   labels the setup file names (`gh label create <name>`). Done when each number is known.
5. **Write the setup file** from [../assets/toryo-loop.md](../assets/toryo-loop.md) to `docs/agents/toryo-loop.md`,
   every `<value>` filled. [../samples/setup-file.md](../samples/setup-file.md) is a filled one.
6. **Write the agent definitions.** For Claude Code, copy [../assets/agents/](../assets/agents/) to `.claude/agents/`
   with the chosen models and efforts ([claude-code.md](claude-code.md)). Another harness gets the same three roles in
   its own form, or runs each role as a new session with its brief.
7. **Offer the guard hook** ([../assets/guard-hook.py](../assets/guard-hook.py)): it refuses a commit whose checkout
   is on the default branch, a worktree past the cap, and the setup file's own guard patterns. On a
   yes, install it as [claude-code.md](claude-code.md#the-guard-hook) says and run its self-test.
8. **Check the trackers:** `gh issue view <n> --json number,title,state` prints each of the three issues, and
   `gh label list --limit 500 --json name -q '.[].name' | grep -Fx -- '<label>'` prints each label the setup file
   names (a search matches substrings, so it proves nothing). A `403` from an organisation means the token needs
   SSO authorising: the operator does it, then you rerun the check.
9. **Land the setup** on a branch (`chore/toryo-loop-setup`) through a pull request the operator approves: the setup
   file, the agent files and the hook. Agent definitions load only in a session started from a checkout that has them.
10. **Ask for a new session.** Done when the operator has the line to start it with: "Run toryo-loop in
    `<mode>` mode."

## The knobs

Each group is one section of the setup file. Defaults are what the trials proved ([trials.md](trials.md)).

| Group | Knob | Default |
| --- | --- | --- |
| Repository | slug; default branch; branch protection or none; an organisation SSO note | from `gh repo view` |
| Agents | the role-to-model map; the reviewer models in order of preference; effort per role and track; a house-style skill named in every brief | executor: strongest model, medium; executor-light: a cheaper model; reviewer: another model, high for A, medium for B and plan reviews, low for C |
| Tracks | core paths that force A; the B size (lines besides tests); the PR cap; mechanical paths left out of review | B ≤ about 100 lines; cap about 400 lines |
| Pipeline | one-file-per-entry registries; hot files; worktree root; branch naming; worktree cap | `<type>/<short>` branches; cap 6 |
| Build | test invocation; local check commands; the type-check gate; changelog convention; what makes a minor bump; commit form and trailer | from CI and `CONTRIBUTING.md` |
| PR | the PR body skill; the diagram rule; the agent marker line; the agent label; forbidden labels; the docs-only rule | marker "Opened by an agent (toryo-loop).", label `agent` |
| Landing | land command and flags; required checks; the allowed-red pattern; bots that write to the default branch | `gh pr merge <N> --merge --match-head-commit <sha>`; no allowed red |
| Trackers | map issue; deferred issue; nits issue; decision label; the in-progress marker (a label or a project status); the mirror and its sync traps; the offline-check registry; the label taxonomy | no mirror |
| Safety | the secrets file; guard patterns; the running-job rule; literal policies (values that never go on the default branch) | the rules in `SKILL.md` |
| Trials | the open trial; the closed ones, one line each | none |
| Mode | the mode to take when the operator names none; the current one lives in the map issue | finish and stop |

## Keeping it current

- Every change to the setup file, a trial's line included, goes through a track C pull request or the operator's own
  edit. The current mode lives in the map issue, not here.
- A knob a step needs and the file lacks: take its default, note it in the closing comment, and add a nit to fill it.
