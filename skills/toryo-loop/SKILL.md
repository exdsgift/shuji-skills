---
name: toryo-loop
description: Runs a coding-agent delivery loop as the master session over a queue of GitHub issues - executor subagents build each ticket in a worktree up to a draft pull request, a fresh reviewer on another model checks it, and the master lands it and keeps the trackers current, in one of three autonomy modes. Use it when someone asks to work through a backlog or a ticket queue with agents, run the next tickets autonomously, do one ticket end to end and report, finish what is in flight and stop, resume the loop after a usage limit or a restart, or set up executor and reviewer agents for a repository, even if they do not name the skill. Not for reviewing, fixing or merging a single pull request by hand, nor for running one plan's tasks inside one session.
---

# Toryo loop

The toryo (棟梁) is the master carpenter who plans the house, hands each part to a crew and inspects it before it goes up.
Here the **master** is this session. It picks a ticket from the **queue**, briefs an **executor** that builds it in its
own worktree and stops **at the push**, has a **reviewer** on another model check the pull request, sends proved bugs
back for one fix round, lands the pull request and keeps the issues current. It never writes the change itself.

Each repository keeps its own values (issue numbers, check commands, the land command, models, core paths) in its
**setup file**, `docs/agents/toryo-loop.md`. Every `<value>` below comes from there. Filled examples for the made-up
repository `acme/widgets` are in [samples/](samples/): read the one closest to what you are writing before you write it.

## The rules that hold in every mode

1. **Two tickets in flight, never three.** Ticket N is in review, fix or landing; ticket N+1 is in development on files
   disjoint from N's. A third ticket waits, however idle the master is, until N lands.
2. **The master briefs, decides, lands and keeps the trackers.** The executor writes the change. The master never
   squashes, rebases or force-pushes the default branch.
3. **The executor stops at the push:** a draft pull request is open and the local checks pass. CI runs beside the
   review.
4. **The reviewer is fresh, read-only and on another model** than the executor's. Its report is its whole output.
5. **A finding is bug-level only with a proof:** a test that fails, a red check, or a concrete input with its wrong
   output. Everything else is a nit. Proved bugs get one fix round, then a low re-check of the interdiff.
6. **Clean up only after the land is proved:**
   `<land command> && test "$(gh pr view <N> --json state -q .state)" = MERGED && <clean-up>`. A land command's text,
   or its status read through a pipe, proves nothing.
7. **State comes from GitHub**, never from chat or an agent's memory: `gh pr list --state open --json
   number,isDraft,mergeable,title`, the issues, the worktrees. Report state as one line per pull request.
8. **The master decides what is the master's.** A design choice inside a fix round is the master's: it takes the
   simplest safe option, writes it on the issue and goes on. Only a choice that changes what the work means, or one
   only the operator can take, goes to the decision batch issue.
9. **Every mode stops on an unexplained red check or a safety rule**, and reports.

## Start of every session

1. **Read the setup file.** When the repository has none, run the first-run walk in
   [references/setup.md](references/setup.md) and start no ticket until it is done. Done when the setup file is read.
2. **Name the mode** the operator asked for (table below), or the setup file's default when they named none, in one
   line, and write it in the map issue. Done when the map issue shows it.
3. **Read the state:** the open pull requests, the queue, `git worktree list`. A ticket already in flight resumes
   from its worktree and its pull request, never from zero ([recovery](references/recovery.md)). Done when you can
   name N, N+1 and the step each one is at.

## Modes

| Mode | The operator says | The master |
| --- | --- | --- |
| **Autonomous** | "work through the queue", "keep going" | takes the first free row each time a slot opens, until the queue is empty or every row waits on a decision |
| **Finish and stop** | "finish what's in flight and stop" | takes N, and N+1 if already started, through landing; starts nothing new |
| **One ticket** | "do one ticket", "do #44" | takes one ticket through landing, then sends the stop report |

When the mode ends, send the stop report (below). After "stay stopped", read agent notifications and relaunch nothing.

## Roles

| Role | Builds | Model and effort |
| --- | --- | --- |
| **Executor** | track A and B tickets, tests first, one draft pull request | the strongest model; medium effort |
| **Executor-light** | track C tickets (docs, config, a rename, labels); says so and stops when logic is needed | a cheaper model |
| **Reviewer** | nothing: reviews and reports; no edit, comment, push or state change | another model than the executor's; effort high for A, medium for B and plan reviews, low for C |

- Launch each role by its own agent type, never a general-purpose agent. The first time a type runs, its brief asks
  it to print its exact model id on line one; check it against the setup file.
- The reviewer models are listed in the setup file in order of preference. When one is refused, try the next. When
  none is available, run the review on the executor's model in a fresh context, and say so on the pull request and in
  the closing comment. The review always runs.
- The executor never reviews, marks ready or merges its own pull request. When it meets an open design choice its
  brief does not settle, it writes the choice, the options and its pick, and stops.
- Claude Code specifics (agent files, effort at launch, resuming with SendMessage, cache, hooks):
  [references/claude-code.md](references/claude-code.md). A harness without subagents runs each role in a new session.

## Tracks

Decide the **track** before a ticket starts; write it in the brief and in the queue's Track column.

| Track | When | Flow |
| --- | --- | --- |
| **A** full | touches a core path, changes what a number or a verdict means, has an open design choice, or runs past about 100 lines besides tests | plan, plan review, build, high review, fix round, low re-check |
| **B** light | a clear fix of at most about 100 lines besides tests, no open choice | build, high review; a low re-check only after a proved bug |
| **C** mechanical | docs, config, a rename, labels: no logic | executor-light builds, one low review; a re-check only after a proved bug |

Any one A reason makes it A, however small the diff. Size, slicing past the PR cap, and a ticket that moves from B to
A: [references/tracks.md](references/tracks.md).

## The lifecycle

Each step ends on its done-when. A–C marks the tracks a step applies to; unmarked steps apply to all.

1. **Pick** the queue's first row with no open blocker. For the N+1 slot, take the first row whose files are disjoint
   from N's, skipping rows that overlap (rules in Pipeline, below). Done when the ticket is named and its file list
   has been compared with `gh pr diff <N> --name-only`.
2. **Start the trackers:** the issue gets the setup file's in-progress marker, and its mirror goes to In Progress.
   Done when both show it.
3. **Classify** the track. Done when the track is in the queue row.
4. **Brief:** fill the template from [assets/briefs/](assets/briefs/) into a file in the session's scratchpad, then
   launch the agent with "Read your brief at `<path>` and follow it exactly". Done when the file exists and the agent
   is running.
5. **Plan (A):** the executor writes a plan with no code and no branch: decisions with options and a pick, files,
   tests with inputs and expected outputs, size and slices. Done when the reply gives the plan's path, its slices and
   its decisions D1..Dn in one paragraph.
6. **Plan review (A):** a fresh reviewer at medium checks every claim against the default branch with `file:line`,
   looks for plan bugs and gives a view on each decision. Done when its report is in. Skip it when the plan and code
   already exist.
7. **Decide (A):** take the master's decisions; send the operator's to the decision batch issue and take another
   ticket meanwhile. Write the binding changes into the build brief and a summary on the issue: the scratchpad does
   not last. Done when the build brief and the issue comment exist.
8. **Build:** a worktree from a freshly fetched default branch on a new `<type>/<short>` branch, tests first (each fails
   on the default branch), commit and push after each step. Done when the branch is pushed with its tests and code.
9. **Local checks** in the foreground: the setup file's check commands. Done when each exits 0 on the head.
10. **Draft pull request:** the body through `--body-file`, a first line saying an agent opened it, the agent label,
    `Closes #<n>` or `Part of #<n>`, and a diagram when the setup file's diagram rule asks for one. Done when the
    draft is open.
11. **Stop at the push.** The executor replies with the pull request number, the head SHA, the local checks, and one
    line per brief item: done or not verified.
12. **Review:** the code-review level is high for A and B, low for C (the reviewer's effort is in Roles). Launch it
    at the push with CI running beside it; N+1's waits until N goes into landing. Done when the report is in.
13. **Fix round:** the bug-level findings with their proof and the red checks, together, in one round, through the
    fix-round brief (SendMessage to the same executor), each bug with its probe to turn into a test that fails before
    the fix. A nit under five minutes in a file the round already touches rides along; every other nit, and every
    claim without a proof, goes to the nits issue at once. With no bug-level finding and green CI, go to step 15.
    Done when the executor replies with the new head and what each item became
    ([references/review.md](references/review.md)).
14. **Low re-check** of the interdiff `<old>..<new>` only, by the same reviewer, skipping the default branch's merged
    lines but reading each merge's conflict resolution (`git show --remerge-diff <merge>`). A bug it proves gets one
    more small fix and a re-check of that commit alone. Done when the reviewer says clean.
15. **Ready:** `gh pr ready <N>` once the reviews are clean and CI is green on a head that contains the latest
    default branch: `gh api repos/<owner>/<repo>/compare/<default>...<head sha> -q .behind_by` prints `0`. Done when
    the pull request is no longer a draft.
16. **Land** with the setup file's land command, then check `MERGED`. When nothing landed because the default branch
    moved, run the same command again; the master never rebases or force-pushes a head
    ([references/landing.md](references/landing.md)). Done when `gh pr view <N> --json state -q .state` prints
    `MERGED`.
17. **Clean up**, only after `MERGED`, a `git fetch origin --prune` and a fast-forward of the session checkout: the
    remote head branch, the local branch, the worktree and the `pr/<N>` ref. Done when none of the four remains.
18. **Update the trackers:** comment on each issue the pull request served (what landed, what is left) and close it
    when nothing is left; remove its queue row; update the mirror; send nits to the nits issue and each "for now X,
    later Y" to the deferred issue. Done when all of that shows on GitHub and in the mirror
    ([references/trackers.md](references/trackers.md)).
19. **Next ticket, as the mode allows.** Send no report between tickets: report only what needs the operator.

## Pipeline

- N+1's executor starts only when N's draft pull request is open and in review.
- **Disjoint** means no shared file among: the setup file's hot files, any shared index or registry module, and any
  test file both touch. Files in a one-file-per-entry registry (a `changelog.d/` folder, for example) may overlap.
  On overlap, N+1 waits until N lands.
- N has precedence: its fix round comes first, and N+1's review starts once N goes into landing. Once N lands, N+1
  fetches and merges the default branch and reruns its checks; when that merge touches N+1's files, the interdiff gets a
  low review.
- Every pull request is based on the default branch, never stacked on another: landing deletes the head branch, and
  GitHub then closes every pull request based on it.
- The worktree cap (default six) is the guard hook's to enforce.

## Operator decisions

- The operator decides an open design choice that changes what the work means, and what only they can decide. The
  master decides everything else.
- Collect the operator's decisions in the decision batch issue. Ask them only when the operator calls for them: one
  question at a time, in plain words, with the options, the cost and risk of each, and one recommendation listed
  first. When a question is not understood, explain it again more simply. Meanwhile work on tickets that do not
  depend on them.
- Answer the operator in their language; everything committed is in English unless the setup file says otherwise.

## Safety

These hold everywhere: the executor agent files carry them, and each build brief adds the setup file's own under
House rules.

- Never type a credential, and never read the real secrets file: the operator fills it; tests use made-up tokens.
- Nothing durable lives only on the compute: push early, and put plans' decisions on the issue.
- Quote every heredoc (`<<'EOF'`), and pass pull request, issue and commit text with `--body-file` or `-F`.
- Run checks in the foreground: an agent whose turn ends while its own background job runs loses the result.
- Read a running job; never kill it.
- A skip or an xfail added to get green is a defect. A pull request goes ready only on green checks.
- Machine rules (the shell, a broken `gh` subcommand) live in a per-machine file outside the repository; paste them
  into each brief as its `{machine rules}` block.

## The stop report

A table of what landed (pull request, ticket, change, issue), then what is planned but not built and where its state
lives, then one question: "Resume with `<next ticket>`, or stay stopped?" The shape is in
[samples/stop-report.md](samples/stop-report.md).

## Files

- [references/setup.md](references/setup.md): the first run, every knob of the setup file. Read it when the
  repository has no setup file, or a knob is missing.
- [references/tracks.md](references/tracks.md): classifying, sizing and slicing. Read it at step 3 when the track is
  not obvious.
- [references/review.md](references/review.md): the proof rule, nits, the fix round, the re-check, the deep audit.
  Read it before steps 12 to 14.
- [references/landing.md](references/landing.md): the land command, its refusals, the `MERGED` check, branch
  recovery. Read it before step 16.
- [references/trackers.md](references/trackers.md): the queue table, the deferred, nits and decision issues, the
  mirror. Read it at steps 2 and 18.
- [references/recovery.md](references/recovery.md): usage limits, a refused model, a stalled agent, a restart, a land
  that did not land. Read it when something stops.
- [references/claude-code.md](references/claude-code.md): agent files, effort, resuming, the guard hook. Read it
  when writing the agent files, launching an agent, or installing the hook.
- [references/trials.md](references/trials.md): how to change the loop itself, and the defaults the trials proved.
  Read it before changing a model, an effort, a step or a threshold.
- [assets/](assets/): the setup file template, the five brief templates, the three agent files and the optional
  guard hook, which the first run copies.

## When the skill is at fault

When something fails because of this skill, not because of the request, the project or the machine, offer to report it
where the skill is kept. A fault of the skill is a script that crashes or rejects valid input, a check that passes
what a rule here forbids, two instructions or an instruction and a sample that disagree, or a rule followed to the
letter that gives a wrong result. A missing Node, browser or network, a fact the request lacks, or a slip of yours
that a second try fixes is not one.

1. Finish the user's task, or set it aside, first: the report never replaces it.
2. Look for the same report: `gh issue list --repo exdsgift/shuji-skills --state all --search "<words of the error>"`.
   When one exists, offer a comment with what is new instead of a new issue.
3. Draft it: the title `toryo-loop: <what fails, in a few words>`, and a body with what you ran, what happened (the
   error text), what you expected and the rule or file here that says so, the agent and system, and a diff when you
   know the cause. Leave the user's work out: no path outside the skill, and no code, names, numbers or diagram text
   from their project. Describe the input in general words ("a flowchart with a quoted label holding a colon") or
   write a minimal one of your own.
4. Show the draft and ask once: "This looks like a defect in toryo-loop. Open this issue on
   github.com/exdsgift/shuji-skills?" Post nothing before a yes. A no ends it, and you do not ask again about the same
   fault.
5. On a yes, run `gh issue create --repo exdsgift/shuji-skills --title "<title>" --body-file -` with the draft and
   give the link. Without `gh`, or signed out, give the user
   `https://github.com/exdsgift/shuji-skills/issues/new?template=skill-defect.yml&skill=toryo-loop` to open, with
   the draft to paste.
