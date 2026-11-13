#!/usr/bin/env bash
# toryo-loop guard: a Claude Code PreToolUse hook on Bash.
# Refuses (exit 2, reason on stderr) a git commit whose checkout is on the default branch, a `git worktree add` past
# the setup file's worktree cap, and any command matching a pattern in the setup file's ```guard block.
# It reads the command's text, so a word in a commit message or a PR body counts: pass text with -F / --body-file.
# Self-test: bash guard-hook.sh --self-test
set -u

setup_rel="docs/agents/toryo-loop.md"
self="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"

json_field() { # $1: python expression on the parsed hook input `d`
  if command -v python3 >/dev/null 2>&1; then
    python3 -c "import json,sys; d=json.load(sys.stdin); print($1 or '')" 2>/dev/null
  elif command -v jq >/dev/null 2>&1; then
    case "$1" in
      *command*) jq -r '.tool_input.command // ""' ;;
      *cwd*) jq -r '.cwd // ""' ;;
    esac
  else
    return 3
  fi
}

refuse() { echo "toryo-guard: $1" >&2; exit 2; }

guard() {
  local input cmd cwd dir top setup default cap branch n line re reason
  input=$(cat)
  cmd=$(printf '%s' "$input" | json_field "d.get('tool_input',{}).get('command')") || {
    echo "toryo-guard: inactive, it needs python3 or jq" >&2; exit 1; }
  cwd=$(printf '%s' "$input" | json_field "d.get('cwd')")
  [ -n "$cmd" ] || exit 0
  dir=${cwd:-$PWD}
  # The checkout a git command acts on: its first -C, else a leading `cd <dir> &&`, else the session's.
  if [[ $cmd =~ git[[:space:]]+-C[[:space:]]+(\"[^\"]+\"|\'[^\']+\'|[^[:space:]]+) ]]; then
    dir=${BASH_REMATCH[1]//[\"\']/}
  elif [[ $cmd =~ ^[[:space:]]*cd[[:space:]]+([^[:space:];&]+)[[:space:]]*\&\& ]]; then
    dir=${BASH_REMATCH[1]}
  fi
  [[ $dir = /* ]] || dir="${cwd:-$PWD}/$dir"
  top=$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null) || top=""
  setup="${top:+$top/$setup_rel}"

  default=$( [ -f "$setup" ] && grep -m1 -oE 'Default branch: *`?[A-Za-z0-9._/-]+' "$setup" | sed -E 's/.*: *`?//')
  [ -n "$default" ] || default=$(git -C "$dir" symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's#^origin/##')
  [ -n "$default" ] || default=main
  cap=$( [ -f "$setup" ] && grep -m1 -oE 'Worktree cap: *`?[0-9]+' "$setup" | grep -oE '[0-9]+$')
  [ -n "$cap" ] || cap=6

  if [[ $cmd =~ (^|[^[:alnum:]_-])git([[:space:]]+-C[[:space:]]+[^[:space:]]+)?[[:space:]]+commit([[:space:]]|$) ]]; then
    branch=$(git -C "$dir" symbolic-ref --short HEAD 2>/dev/null)
    [ "$branch" = "$default" ] && refuse "a commit on $default in $dir. Commit in the ticket's worktree: git -C <worktree> commit."
  fi

  if [[ $cmd =~ git([[:space:]]+-C[[:space:]]+[^[:space:]]+)?[[:space:]]+worktree[[:space:]]+add ]]; then
    n=$(git -C "$dir" worktree list --porcelain 2>/dev/null | grep -c '^worktree ')
    n=$((n - 1))
    [ "$n" -ge "$cap" ] && refuse "$n worktrees already, the cap is $cap. Remove a merged one first (git worktree list)."
  fi

  if [ -f "$setup" ]; then
    while IFS= read -r line; do
      [ -n "$line" ] || continue
      re=${line%% :: *}; reason=${line#* :: }
      [ "$re" = "$line" ] && reason="it matches a guard pattern in $setup_rel"
      printf '%s' "$cmd" | grep -Eq -- "$re" && refuse "$reason (pattern: $re)."
    done < <(awk '/^```guard[[:space:]]*$/{f=1;next} f&&/^```/{f=0} f' "$setup")
  fi
  exit 0
}

self_test() {
  local t fail=0 code
  t=$(mktemp -d) || exit 1
  trap "rm -rf '$t'" EXIT
  git -C "$t" init -q -b main repo && cd "$t/repo" || exit 1
  git config user.email t@example.com && git config user.name t
  mkdir -p docs/agents
  printf -- '- Default branch: `main`\n- Worktree cap: 1\n\n```guard\nrm -rf data :: data/ is not regenerable\n```\n' \
    > "$setup_rel"
  git add . && git commit -qm init && git worktree add -q -b feat/x ../wt-x
  check() { # $1 expected exit, $2 command, $3 cwd
    code=0
    printf '{"tool_name":"Bash","cwd":"%s","tool_input":{"command":"%s"}}' "$3" "$2" | bash "$self" >/dev/null 2>&1 || code=$?
    if [ "$code" = "$1" ]; then echo "ok   $1  $2"; else echo "FAIL want $1 got $code: $2"; fail=1; fi
  }
  check 2 'git commit -m x' "$t/repo"
  check 0 "git -C $t/wt-x commit -m x" "$t/repo"
  check 2 "git -C $t/repo commit -m x" "$t/wt-x"
  check 0 'git commit -m x' "$t/wt-x"
  check 2 "cd $t/repo && git commit -m x" "$t/wt-x"
  check 2 'git worktree add ../wt-y -b feat/y' "$t/repo"
  check 2 'rm -rf data/cache' "$t/repo"
  check 0 'git status' "$t/repo"
  check 0 'git log --grep commit' "$t/repo"
  [ "$fail" = 0 ] && echo "self-test: clean" || { echo "self-test: failed"; exit 1; }
}

if [ "${1:-}" = "--self-test" ]; then self_test; else guard; fi
