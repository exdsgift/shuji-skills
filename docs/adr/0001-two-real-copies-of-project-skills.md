# Two real copies of project skills

bushido-setup commits every project skill twice, as real files in `.agents/skills/` (read by Codex, Gemini CLI,
Cursor and Copilot) and in `.claude/skills/` (read by Claude Code), and CI fails when the two copies differ. A symlink
from one folder to the other would keep a single copy, but Git checks a committed symlink out on Windows as a one-line
text file, and Claude Code then lists no skill at all; the skills CLI's Windows junctions are committed as plain
duplicates anyway. When Claude Code reads `.agents/skills/`, drop `.claude/skills/` and the CI check.

## Considered Options

- **A symlink from `.claude/skills/` to `.agents/skills/`**: one copy, but every Windows clone without symlink support
  loses its skills silently. Tested with Claude Code 2.1.299 and Git for Windows 2.54.
- **Only `.agents/skills/`**: Claude Code would see no project skill.
