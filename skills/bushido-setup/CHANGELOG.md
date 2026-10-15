# Changelog

What changed in bushido-setup, newest first. There are no version numbers: each push to `main` is a release, and
`npx skills update` or `claude plugin update bushido-setup@shuji` brings it.

## 2026-10-15

### License

- The skill is under the MIT license, with a copy in its folder. The text it writes into your repository from this
  skill may be used without that notice; the files from Matt Pocock's templates keep his MIT notice beside them.

### First version

- Sets up a new or existing repo for coding agents: the stack's official generator for Python, TypeScript, Go and
  Rust, or a generic mode for any other stack, with nothing existing overwritten.
- Writes a root `AGENTS.md` under 100 lines with fifteen precepts from the classic programming manuals, a one-line
  `CLAUDE.md` import, the Gemini CLI settings, and folder `AGENTS.md` files only where a folder has rules of its own.
- Keeps memory in `docs/adr/`, `GLOSSARY.md`, a changelog and a secrets table, each written only when it has content.
- Installs sixteen companion skills from Matt Pocock, ponytail and superpowers as real copies for every agent, with one
  line in `AGENTS.md` saying when to use each.
- Writes a CI workflow that checks the code, the docs' links, the docs index, the folder map and the skill copies.
- Run again, it audits the repo and proposes fixes.
