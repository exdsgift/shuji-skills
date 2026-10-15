---
name: release
description: Releases ledger by tagging vX.Y.Z on main, which makes GitHub Actions build the image and deploy it to Fly.io. Use only when the user runs /release.
disable-model-invocation: true
---

# Release

A `vX.Y.Z` tag on main is the release. GitHub Actions then builds the image and deploys it to Fly.io.

1. Print the day with `date +%A`. When it prints Friday, stop and tell the user. The team never deploys on a Friday.
   Done when the day is not Friday.
2. Ask the user for the version `X.Y.Z`. Done when the user names it.
3. Switch to main and update it: `git switch main && git pull --ff-only`. Done when `git status` shows a clean tree,
   up to date with `origin/main`.
4. Tag the head of main: `git tag vX.Y.Z`. Done when `git tag --points-at HEAD` prints `vX.Y.Z`.
5. Push the tag: `git push origin vX.Y.Z`. Done when `git ls-remote --tags origin vX.Y.Z` prints it.
6. Watch the run the tag started: `gh run list --branch vX.Y.Z`, then `gh run watch <run-id>`. Done when the run
   succeeds. When it fails, report the failed step to the user.
