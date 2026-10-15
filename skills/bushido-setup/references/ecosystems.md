# Ecosystems

The official generator writes each project's skeleton; this skill adds what generators leave out. The versions below
were current on 2026-10-15. Before you pin one, read the tool's current version from the tool itself or its registry.

## Detect

Look at the root, then one level down for monorepos.

| Ecosystem | Manifest | Lockfiles and pins | Shape |
| --- | --- | --- | --- |
| Python | `pyproject.toml`, `setup.py`, `setup.cfg`, `requirements*.txt`, `Pipfile` | `uv.lock`, `poetry.lock`, `pdm.lock`, `Pipfile.lock`, `.python-version` | `src/<pkg>/__init__.py` is the src layout; `[tool.uv.workspace]` a workspace |
| TypeScript, JavaScript | `package.json` | `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, `bun.lock`; the `packageManager` field | `pnpm-workspace.yaml` or a `workspaces` field is a monorepo; `vite.config.*`, `next.config.*` a framework |
| Go | `go.mod` | `go.sum`, `go.work` | `cmd/*/main.go`, `internal/` |
| Rust | `Cargo.toml` | `Cargo.lock`, `rust-toolchain.toml` | `src/main.rs`, `src/lib.rs`, `crates/*` |

The package manager is the one whose lockfile is present. When none of these markers is present and the user names
another stack, or no code at all, use the generic mode.

## Files never to overwrite

Read these, report on them, and propose a diff; change them only after the user confirms: every manifest and lockfile
above, `README*`, `LICENSE*`, `.gitignore`, `.gitattributes`, `.editorconfig`, everything under `.github/`, lint,
format and test configs, `tsconfig*.json`, `.python-version`, `rust-toolchain.toml`, `.env*`, `AGENTS.md`,
`CLAUDE.md`, `.devcontainer/`, and every source folder. Lockfiles change only through their own tool.

## Python

| Kind | Generator |
| --- | --- |
| Library | `uv init --lib --name <name> --author-from none` |
| App or CLI | `uv init --app --package --name <name> --author-from none` |
| Service that is never installed | `uv init --app --no-package --name <name> --author-from none` |
| Existing code with no manifest | `uv init --bare --name <name>` |

- Run it in the repo root, and add `--vcs none` when `.git` exists. `--author-from none` keeps the git user's email out
  of `pyproject.toml`.
- `uv init` refuses an existing `pyproject.toml`, so it is safe to try. It writes an empty README and a placeholder
  description: fill both from step 2.
- Dev tools: `uv add --dev pytest ruff mypy`. Offer pyright instead of mypy; ty is still beta, so never make it the
  default.
- Ruff needs no rule list: its defaults cover 413 rules since 0.16.
- Add to `pyproject.toml`, so the tools skip the installed skills and find the code:

  ```toml
  [tool.ruff]
  extend-exclude = [".agents", ".claude"]

  [tool.mypy]
  exclude = ['^\.agents/', '^\.claude/']

  [tool.pytest]
  testpaths = ["tests"]
  ```

  For a service made with `--no-package`, add `pythonpath = ["."]` under `[tool.pytest]`: its code sits at the root,
  outside any installed package.
- The generator writes no test, and pytest fails on an empty suite: write one test of the generated entry point in
  `tests/`.
- Commit `uv.lock`.
- Keep the Python version the generator pins in `.python-version` and `requires-python`.
- Commands: lint `uv run ruff check`; format `uv run ruff format --check`; types `uv run mypy .`; all tests
  `uv run pytest`; one test, for AGENTS.md only, `uv run pytest tests/test_x.py::test_name -q`.
- CI: `astral-sh/setup-uv`, then `uv sync --locked --all-extras --dev`, then lint, format, types and all tests.
- `.gitignore` template `Python`; Dependabot ecosystem `uv`; indent 4 spaces.
- Versions on 2026-10-15: uv 0.13.1, Ruff 0.17.0, pytest 9.1.1, mypy 2.4.0, pyright 1.1.414, Python 3.15.

## TypeScript and JavaScript

A single package uses npm, which ships with Node; a monorepo uses pnpm. A lockfile or the user overrides this.

| Kind | npm | pnpm |
| --- | --- | --- |
| Node library or app | `npm init -y` in an empty folder, then `npm i -D typescript vitest @biomejs/biome`, `npx tsc --init`, `npx biome init` | `pnpm init`, then `pnpm add -D` the same, `pnpm exec tsc --init`, `pnpm exec biome init` |
| Web app | `npm create vite@latest . -- --template react-ts --no-interactive` | `pnpm create vite . --template react-ts --no-interactive` |
| Next.js app | `npx create-next-app@latest . --yes` | `pnpm create next-app . --yes` |
| Monorepo | | a root `package.json` with `"private": true`, and `pnpm-workspace.yaml` holding `packages: [packages/*]` |

- Run each generator in the repo root (`.`), then set the project's name with `npm pkg set name=<name>` and run
  `npm install`, which writes the lockfile. create-vite installs nothing by itself. Vite also takes `vue-ts`,
  `svelte-ts`, `solid-ts` or `vanilla-ts`.
- Code a generator wrote a minute ago counts as new code: formatting it once is fine.
- Run `npm init -y` only in an empty folder: beside a `package.json` it rewrites the file and exits 0.
- Lint and format:
  - Vite: keep its Oxlint for lint, and add Biome as the formatter alone: `"linter": { "enabled": false }`,
    `"assist": { "enabled": false }`, `"formatter": { "indentStyle": "space" }`, and the quote style and semicolons of
    the generated code for JavaScript and CSS alike.
  - Next.js: keep the ESLint or Biome it installs.
  - By hand: Biome for both. Use ESLint with typescript-eslint only when a type-aware rule or a plugin needs it.
  - Exclude the installed skills: `"files": { "includes": ["**", "!.agents", "!.claude"] }` in `biome.json`,
    `ignores: [".agents/**", ".claude/**"]` in an ESLint config, `ignorePatterns` in `.oxlintrc.json`.
- TypeScript 7 is current; stay on `typescript@~6.0` when a tool needs the TypeScript API (typescript-eslint supports
  only versions below 6.1, and Vite pins `~6.0.2`).
- `tsconfig.json` by kind: a bundled web app uses `module: esnext` with `moduleResolution: bundler` and `noEmit`; a
  Node app `module: nodenext` with `verbatimModuleSyntax`; a library that ships JavaScript `module: node18`,
  `declaration`, `rootDir: src`, `outDir: dist`; a library that ships its TypeScript sources `noEmit`. Set
  `"type": "module"` in `package.json`.
- create-next-app writes an `AGENTS.md`, and `bun init` a `CLAUDE.md`: merge them as [agent-files.md](agent-files.md)
  says, and set `BUN_AGENT_RULE_DISABLED=1` before `bun init`.
- Vitest fails on an empty suite. Write one test of the generated code; a React component can be tested with
  `renderToString` from `react-dom/server`, which needs no new library. When no such test is possible, run it as
  `vitest run --passWithNoTests`.
- Add `".agents"` and `".claude"` to the `exclude` list of `tsconfig.json` when its `include` would reach them.
- Commands with npm (with pnpm, `pnpm exec` replaces `npx`): format and lint `npx biome ci`, plus `npm run lint` for
  Oxlint; types `npx tsc --noEmit`, or `npx tsc -b` when `tsconfig.json` holds only `references`, as Vite's does; all
  tests `npx vitest run`; one test, for AGENTS.md only, `npx vitest run path/to/file.test.ts`.
- CI with npm: `actions/setup-node` with `node-version: 24` and `cache: npm`, then `npm ci`, then format and lint, types
  and all tests. With pnpm: `pnpm/action-setup` first, `cache: pnpm`, and `pnpm install --frozen-lockfile`.
- `.gitignore` template `Node`; Dependabot ecosystem `npm` (it covers pnpm); indent 2 spaces.
- Versions on 2026-10-15: Node 24 LTS (26 becomes LTS on 2026-10-28), TypeScript 7.0.2, pnpm 12.11.2, Biome 2.5.15,
  Vitest 5.0.4, Vite 8.3.4.

## Go

| Kind | Layout after `go mod init <module path>` |
| --- | --- |
| Library | the package at the root: `<name>.go`, `<name>_test.go`; helpers in `internal/<pkg>/` |
| One command | `main.go` at the root |
| Several commands or a service | `cmd/<prog>/main.go`, shared code in `internal/` |

- Use the repository path as the module path, e.g. `github.com/<owner>/<repo>`.
- Follow go.dev/doc/modules/layout. Never create `pkg/`: the golang-standards layout is not official.
- `go mod init` refuses an existing `go.mod`.
- Tools: gofmt and go vet ship with Go. Install golangci-lint as a binary, and give it `.golangci.yml` with
  `version: "2"`.
- Commands: format `test -z "$(gofmt -l .)"`; lint `golangci-lint run`; vet `go vet ./...`; all tests `go test ./...`;
  one test, for AGENTS.md only, `go test ./path/to/pkg -run TestName`.
- CI: `actions/setup-go` with `go-version-file: go.mod`, then the gofmt check, `golangci/golangci-lint-action`,
  `go vet ./...` and `go test ./...`.
- `.gitignore` template `Go`; Dependabot ecosystem `gomod`; indent with tabs in `*.go`.
- Versions on 2026-10-15: Go 1.27.2, golangci-lint 2.14.0.

## Rust

| Kind | Generator |
| --- | --- |
| Binary | `cargo new <name>`, or `cargo init` in an existing folder |
| Library | `cargo new --lib <name>`, or `cargo init --lib` |
| Workspace | a root `Cargo.toml` with `[workspace]`, `members = ["crates/*"]` and `resolver = "3"`, then `cargo new crates/<name>` |

- Add `--vcs none` when `.git` exists.
- Edition 2024 is the default. Commit `Cargo.lock`, for libraries too.
- rustfmt and clippy need no config files.
- Commands: format `cargo fmt --all -- --check`; lint `cargo clippy --all-targets -- -D warnings`; all tests
  `cargo test --all`; one test, for AGENTS.md only, `cargo test -p <crate> <test_name>`.
- CI: `rustup update stable`, then format, lint and all tests.
- `.gitignore` template `Rust`; Dependabot ecosystem `cargo`; indent 4 spaces.
- Versions on 2026-10-15: Rust 1.99.0.

## Generic mode

For any other stack, or a repo with no code: no generator and no dev tools. Write the cross-cutting files and the agent
files, and fill the four choices the sections above make per ecosystem:

- the github/gitignore template named after the stack or its build tool (`Maven`, `Gradle`, `VisualStudio`);
- the indentation the existing code uses, for `.editorconfig`;
- the Dependabot ecosystem from GitHub's list of supported ecosystems (`maven`, `gradle`, `nuget`, `composer`,
  `bundler`, and so on);
- the CI setup action for the stack (`actions/setup-java` with `distribution: temurin`, `actions/setup-dotnet`), at the
  version the build files name, or at the current LTS when they name none, said so in the plan; then the build and
  test commands the user names.

Make a committed wrapper script executable when Git stores it without the bit (`git update-index --chmod=+x mvnw`), or
CI cannot run it; list it in the plan as a run item.
