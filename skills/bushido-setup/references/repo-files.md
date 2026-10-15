# Repo files

The files every repo gets, the ones that depend on the project, and the CI workflow that enforces what prose cannot.
Write a file only when the plan marks it create; for an existing file, propose the missing part as a merge.

## README.md

Keep a README that has content. When there is none, or the generator left it empty or generic, write a short one for
people: the name, one sentence on what the project does, how to install and run it, and the license.

## .editorconfig

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 4

[*.go]
indent_style = tab

[Makefile]
indent_style = tab
```

Set `indent_size` to the ecosystem's value in [ecosystems.md](ecosystems.md).

## .gitattributes

```gitattributes
* text=auto eol=lf
*.bat text eol=crlf
*.cmd text eol=crlf
*.ps1 text eol=crlf
```

Every checkout gets LF, as `.editorconfig` and the formatters expect, even on Windows with `core.autocrlf=true`; only
Windows scripts keep CRLF. In an existing repo, tell the user in the hand-over to normalise the files in a commit of
their own after the setup commit: `git add --renormalize . && git commit -m "chore: normalise line endings"`.

## .gitignore

When the repo has no `.gitignore`, fetch the ecosystem's template from github/gitignore:
`gh api gitignore/templates/<Name> --jq .source`, or `https://raw.githubusercontent.com/github/gitignore/main/<Name>.gitignore`.
When a `.gitignore` exists, the generator's included, append only the lines below that it lacks, under a
`# bushido-setup` comment; comments and blank lines never count as missing. Always include:

```gitignore
.env
.env.*
!.env.example
```

## LICENSE

Write it only for the license the user picked: `gh api licenses/<spdx-id> --jq .body`, with trailing blank lines
trimmed. Put the year and the holder the user named where the text has placeholders (MIT's `[year] [fullname]`).
Apache-2.0's placeholders sit in its appendix and stay as they are; its holder goes in a `NOTICE` file:
`<project name>` on the first line, `Copyright <year> <holder>` on the second. For "none", write no file.

## Secrets

When the project uses secrets:

- `.env.example` lists each name with an empty value, under a comment that points to `docs/secrets.md`.
- `docs/secrets.md` holds one row per secret, never a value:

  ```markdown
  # Secrets

  Values never enter the repo. Local values go in `.env`, which Git ignores.

  | Name | Where it lives | Owner |
  | --- | --- | --- |
  | `STRIPE_API_KEY` | 1Password vault "payments"; GitHub environment `prod` | payments team |
  ```

  Write only what the user said. Add a column, such as purpose or rotation, when the user gives its facts.

- `.claude/settings.json` keeps Claude Code from reading the files that hold values; merge the key into an existing
  file, and add any other file the user names as holding values:

  ```json
  { "permissions": { "deny": ["Read(./.env)", "Read(./.env.local)", "Read(./.env.*.local)"] } }
  ```

  `.env.example` stays readable, so agents and the audit can keep its names in step with `docs/secrets.md`.

## CONTRIBUTING.md

Only when outside contributors work on the repo. For people: how to set up and run the project, how to propose a
change (one purpose per pull request, Conventional Commits, tests with every behaviour change), and that `AGENTS.md`
holds the precepts both people and agents follow.

## CI

`.github/workflows/ci.yml` when the remote is on GitHub or there is none yet; on a GitLab remote, write the same two
jobs and the same checks as `.gitlab-ci.yml`. Pin every GitHub action to the full commit SHA of its latest release,
with the tag in a comment: `gh api repos/<owner>/<repo>/releases/latest --jq .tag_name`, then
`gh api repos/<owner>/<repo>/commits/<tag> --jq .sha`.

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

jobs:
  code:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<sha> # <tag>
      # The ecosystem's setup, then its lint, format, type and test commands, from ecosystems.md.

  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<sha> # <tag>
      - name: Links in the docs
        uses: lycheeverse/lychee-action@<sha> # <tag>
        with:
          args: --offline --include-fragments --no-progress --exclude-path .agents --exclude-path .claude './**/*.md'
      - name: Agent files
        run: |
          fail=0
          if [ -d docs ]; then
            for p in docs/*; do
              n=$(basename "$p")
              [ "$n" = README.md ] && continue
              grep -qF "]($n" docs/README.md || { echo "docs/README.md does not link $n"; fail=1; }
            done
          fi
          for f in $(git ls-files -co --exclude-standard '*/AGENTS.md' ':!:.agents/**' ':!:.claude/**'); do
            [ -f "$f" ] || continue
            grep -qF "\`$f\`" AGENTS.md || { echo "the map in AGENTS.md does not list $f"; fail=1; }
            [ -f "$(dirname "$f")/CLAUDE.md" ] || { echo "$f has no CLAUDE.md beside it"; fail=1; }
          done
          # code-review lives only in .agents/skills, so it never hides Claude Code's built-in /code-review.
          if [ -d .agents/skills ] || [ -d .claude/skills ]; then
            diff -r --exclude=code-review .agents/skills .claude/skills || { echo "the skill copies differ"; fail=1; }
          fi
          exit $fail
```

In the generic mode the `code` job holds the commands the user named, or is left out.

## dependabot.yml

`.github/dependabot.yml`, only when the git remote is on GitHub:

```yaml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
  - package-ecosystem: <the ecosystem from ecosystems.md>
    directory: /
    schedule:
      interval: weekly
    groups:
      dependencies:
        patterns: ["*"]
```

GitHub's list of supported ecosystems lags the newest package managers (on 2026-10-15 it named uv up to 0.11 and pnpm
up to 10). Keep the second entry, and tell the user in the hand-over to check that Dependabot's first run succeeds.

## On request only

Pre-commit hooks or lefthook (CI already runs every check), a devcontainer, Renovate (never beside Dependabot), and the
companion packages' plugins and hooks.
