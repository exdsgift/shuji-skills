# shuji

Skills for coding agents, in the Agent Skills format. These are the terms the skills and their docs use.

## bushido-setup

**Precept**:
One of the fixed, short rules of conduct for code, drawn from the classic programming manuals and written into a set-up repo's agent instructions. Style a formatter, linter or type checker can enforce is never a precept.
_Avoid_: rule, guideline, principle, code of conduct

**Memory**:
The versioned record of why a repo is the way it is: its decisions (ADRs), its vocabulary (glossary) and, when it ships versions to anyone, its changelog. An agent's private memory is not part of it.
_Avoid_: context, notes, knowledge base

**Companion skill**:
A third-party skill that bushido-setup installs into a repo, at project scope and chosen one by one, so everyone who clones the repo gets it.
_Avoid_: plugin, dependency, bundled skill

**Process skill**:
A project skill that holds one of the repo's own processes, such as a release, a deploy or a migration, written only from facts a person gave. A process with outside effects runs only when the user starts it.
_Avoid_: workflow, playbook, runbook

**Audit**:
bushido-setup run again on a repo it already set up: a report of what is missing or out of line with the precepts and the structure, followed only by the fixes the user confirms.
_Avoid_: check, lint, review
