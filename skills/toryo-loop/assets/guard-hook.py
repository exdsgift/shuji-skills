#!/usr/bin/env python3
"""toryo-loop guard: a Claude Code PreToolUse hook on Bash.

Refuses (exit 2, the reason on stderr) a git commit whose checkout is on the default branch, a `git worktree add`
past the setup file's worktree cap, and any simple command matching a line of the setup file's ```guard block.
It reads the command's words, so it catches slips, not an agent set on getting round it.
Self-test: python3 guard-hook.py --self-test
"""
import json
import os
import re
import shlex
import shutil
import subprocess
import sys
import tempfile

SETUP = os.path.join("docs", "agents", "toryo-loop.md")
PUNCTUATION = ";&|()\n"
KEYWORDS = {"if", "then", "else", "elif", "while", "until", "do", "!", "{"}
WRAPPERS = {"builtin", "command", "env", "exec", "nice", "nohup", "sudo", "time"}
HEREDOC = re.compile(r"(?<!<)<<(?!<)(-?)\s*(['\"]?)([A-Za-z_][\w.-]*)\2")
GIT_VALUE_OPTIONS = {"-c", "--git-dir", "--namespace", "--config-env", "--super-prefix", "--attr-source"}


class Refuse(Exception):
    pass


def git(cwd, *args):
    if not cwd or not os.path.isdir(cwd):
        return ""
    run = subprocess.run(["git", "-C", cwd, *args], capture_output=True, text=True)
    return run.stdout.strip() if run.returncode == 0 else ""


def setup_values(project):
    """The default branch, the worktree cap and the guard patterns of the project's setup file, and its problems."""
    default, cap, guards, problems = "", 6, [], []
    try:
        with open(os.path.join(project, SETUP), encoding="utf-8") as f:
            text = f.read().replace("\r\n", "\n")
    except OSError:
        return default, cap, guards, problems
    m = re.search(r"Default branch:\s*`?([\w./-]+)", text)
    default = m.group(1) if m else ""
    m = re.search(r"Worktree cap:\s*`?(\d+)", text)
    cap = int(m.group(1)) if m else cap
    block = re.search(r"^```guard[ \t]*\n(.*?)^```", text, re.M | re.S)
    if not block:
        if "```guard" in text:
            problems.append("the guard block is indented or has no closing fence")
        return default, cap, guards, problems
    for n, line in enumerate(block.group(1).splitlines(), 1):
        if not line.strip():
            continue
        pattern, _, reason = line.partition(" :: ")
        pattern = pattern.strip()
        if not pattern:
            problems.append(f"guard line {n} has no pattern")
            continue
        try:
            guards.append((re.compile(pattern), reason.strip() or f"it matches the guard pattern {pattern}"))
        except re.error as e:
            problems.append(f"guard line {n} is not a valid regular expression ({e})")
    return default, cap, guards, problems


def strip_heredocs(command):
    """Drop heredoc bodies, which are data, not commands; the line that opens one stays."""
    out, waiting = [], []
    for line in command.split("\n"):
        if waiting:
            delimiter, tabs = waiting[0]
            if (line.lstrip("\t") if tabs else line) == delimiter:
                waiting.pop(0)
            continue
        out.append(line)
        waiting = [(m.group(3), m.group(1) == "-") for m in HEREDOC.finditer(line)]
    return "\n".join(out)


def lex(text):
    lexer = shlex.shlex(text, posix=True, punctuation_chars=PUNCTUATION)
    lexer.whitespace = " \t\r"
    lexer.whitespace_split = True
    lexer.commenters = ""  # shlex would end a word at any `#`, and swallow the newline after a comment
    return list(lexer)


def merge_backticks(words):
    """A `...` span is one opaque word, like the value the shell would put there."""
    out, span = [], None
    for word in words:
        if span is not None:
            span += " " + word
            if word.endswith("`"):
                out.append(span)
                span = None
        elif word.startswith("`") and not (len(word) > 1 and word.endswith("`")):
            span = word
        else:
            out.append(word)
    return out + ([span] if span is not None else [])


def tokens(command):
    """Words and separators, with shell quoting undone, after dropping heredoc bodies and line continuations."""
    text = strip_heredocs(command).replace("\\\n", " ")
    try:
        return merge_backticks(lex(text))
    except ValueError:  # an unbalanced quote: read the line that has it word by word, never skip a line
        out = []
        for line in text.split("\n"):
            try:
                out += lex(line)
            except ValueError:
                out += [w.strip("'\"") for w in re.findall(r"[;&|()]+|[^\s;&|()]+", line)]
            out.append("\n")
        return merge_backticks(out)


def simple(words):
    """The words that name the command: assignments, keywords, wrappers and the wrappers' options dropped."""
    while words:
        if re.match(r"^[A-Za-z_]\w*=", words[0]) or words[0] in KEYWORDS:
            words = words[1:]
        elif words[0] in WRAPPERS:
            words = words[1:]
            while words and words[0].startswith("-"):
                words = words[1:]
        else:
            break
    return words


def resolve(path, base):
    """An absolute path, or None when the shell would expand something the hook cannot see."""
    if base is None:
        return None
    path = os.path.expandvars(os.path.expanduser(path))
    if "$" in path or "`" in path:
        return None
    return os.path.normpath(os.path.join(base, path))


def check_git(words, where, default, cap):
    i = 1
    while i < len(words) and words[i].startswith("-"):
        word = words[i]
        if word == "-C" and i + 1 < len(words):
            where = resolve(words[i + 1], where)
            i += 2
        elif word == "--work-tree" and i + 1 < len(words):
            where = resolve(words[i + 1], where)
            i += 2
        elif word.startswith("--work-tree="):
            where = resolve(word.split("=", 1)[1], where)
            i += 1
        elif word in GIT_VALUE_OPTIONS:
            i += 2
        else:
            i += 1
    sub = words[i] if i < len(words) else ""
    adds_worktree = sub == "worktree" and words[i + 1:i + 2] == ["add"]
    if sub != "commit" and not adds_worktree:
        return
    if where is None:
        raise Refuse(f"cannot tell which checkout this `git {sub}` acts on. "
                     f"Write its path out: git -C /absolute/path {sub}.")
    if sub == "commit":
        branch = git(where, "symbolic-ref", "--short", "HEAD")
        default = default or re.sub(r"^origin/", "", git(where, "symbolic-ref", "--short", "refs/remotes/origin/HEAD"))
        if branch and branch == (default or "main"):
            raise Refuse(f"a commit on {branch} in {where}. Commit in the ticket's worktree: git -C <worktree> commit.")
    else:
        listing = git(where, "worktree", "list", "--porcelain")
        count = sum(line.startswith("worktree ") for line in listing.splitlines()) - 1
        if listing and count >= cap:
            raise Refuse(f"{count} worktrees already, the cap is {cap}. Remove a merged one first (git worktree list).")


def check(command, cwd, project):
    """Raise Refuse for the first refused simple command; return the setup file's problems otherwise."""
    default, cap, guards, problems = setup_values(project)
    here, stack, words, depth = cwd, [], [], 0
    for token in tokens(command) + [";"]:
        separator = bool(token) and set(token) <= set(PUNCTUATION)
        if depth:  # inside an unquoted $(...): it stays one opaque word of the command around it
            depth = max(0, depth + token.count("(") - token.count(")")) if separator else depth
            continue
        if separator and "(" in token and words and words[-1].endswith("$"):
            words[-1] += "(...)"
            depth = token.count("(") - token.count(")")
            continue
        if not separator:
            words.append(token)
            continue
        words = simple(words)
        if words:
            for pattern, reason in guards:
                if pattern.search(" ".join(words)):
                    raise Refuse(f"{reason} (pattern: {pattern.pattern}).")
            if words[0] in ("cd", "pushd"):
                args = [w for w in words[1:] if not w.startswith("-")]
                here = None if words[1:] == ["-"] else resolve(args[0] if args else "~", here)
            elif os.path.basename(words[0]) == "git":
                check_git(words, here, default, cap)
        words = []
        stack += [here] * token.count("(")
        for _ in range(token.count(")")):
            here = stack.pop() if stack else here
    return problems


def main():
    try:
        data = json.load(sys.stdin)
        command = (data.get("tool_input") or {}).get("command") or ""
        cwd = data.get("cwd") or os.getcwd()
    except (ValueError, AttributeError) as e:
        print(f"toryo-guard: could not read the hook input ({e}); this command was not checked.", file=sys.stderr)
        return 1
    project = os.environ.get("CLAUDE_PROJECT_DIR") or git(cwd, "rev-parse", "--show-toplevel") or cwd
    try:
        problems = check(command, cwd, project)
    except Refuse as refusal:
        print(f"toryo-guard: {refusal}", file=sys.stderr)
        return 2
    if problems:
        print(f"toryo-guard: fix {SETUP}: " + "; ".join(problems) + ".", file=sys.stderr)
        return 1
    return 0


def self_test():
    tmp = tempfile.mkdtemp()
    sh = lambda cwd, *cmd: subprocess.run(cmd, cwd=cwd, check=True, capture_output=True)  # noqa: E731
    repo, wt, other, plain = (os.path.join(tmp, d) for d in ("repo", "wt-x", "other repo", "plain"))
    fixtures = [
        (repo, "main", "- Default branch: `main`\n- Worktree cap: 1\n\n```guard\n"
         "^rm\\b.*\\s(\\./)?data(/|\\s|$) :: data/ is not regenerable\n"
         "^git\\b.*\\bpush\\b.*\\s(--force|-f\\b|\\+) :: force-pushing is the operator's\n```\n"),
        (other, "trunk", "- Default branch: `trunk`\n- Worktree cap: 3\n"),
    ]
    for path, branch, setup in fixtures:
        os.makedirs(os.path.join(path, "docs", "agents"))
        with open(os.path.join(path, SETUP), "w") as f:
            f.write(setup)
        sh(path, "git", "init", "-q", "-b", branch)
        sh(path, "git", "-c", "user.name=t", "-c", "user.email=t@example.com", "add", ".")
        sh(path, "git", "-c", "user.name=t", "-c", "user.email=t@example.com", "commit", "-qm", "init")
    sh(repo, "git", "worktree", "add", "-q", "-b", "feat/x", wt)
    os.makedirs(os.path.join(plain, "docs", "agents"))
    with open(os.path.join(plain, SETUP), "w", newline="") as f:
        f.write("```guard\r\n^rm -rf data\\b :: data is precious\r\ndanger (zone :: x\r\n :: y\r\n```\r\n")
    cases = [  # expected exit, command, cwd, project, a word the message must hold
        (2, "git commit -m x", repo, repo, "Commit in the ticket's worktree"),
        (0, f"git -C {wt} commit -m x", repo, repo, ""),
        (2, f"git -C {repo} commit -m x", wt, repo, ""),
        (0, "git commit -m x", wt, repo, ""),
        (2, f"cd {repo} && git commit -m x", wt, repo, ""),
        (2, f"cd '{repo}' && git commit -m x", wt, repo, ""),
        (2, f"cd {repo}; git commit -m x", wt, repo, ""),
        (2, f"cd {repo}\ngit commit -m x", wt, repo, ""),
        (0, f"(cd {repo} && git status) && git commit -m x", wt, repo, ""),
        (2, f"git -C {wt} status && git commit -m x", repo, repo, ""),
        (0, f"git -C {repo} fetch origin && git -C {wt} commit -m x", wt, repo, ""),
        (2, "git -c user.name=a commit -m x", repo, repo, ""),
        (2, "GIT_EDITOR=true git --no-pager commit -m x", repo, repo, ""),
        (2, "git -C ~/repo commit -m x", wt, repo, ""),
        (2, 'git -C "$TORYO_UNSET" commit -m x', wt, repo, "cannot tell which checkout"),
        (0, "git log --grep commit", repo, repo, ""),
        (0, 'echo "git commit -m x"', repo, repo, ""),
        (2, f'git -C "{other}" commit -m x', repo, other, "a commit on trunk"),
        (2, "git worktree add ../wt-y -b feat/y", repo, repo, "the cap is 1"),
        (0, "git worktree add ../o-wt -b feat/o", other, other, ""),
        (2, "rm -rf data/cache", repo, repo, "not regenerable"),
        (2, "git push origin main --force", repo, repo, "operator's"),
        (2, "git push -f origin main", repo, repo, ""),
        (2, "git push origin +main", repo, repo, ""),
        (0, "git push origin feat/x && git checkout -f main", repo, repo, ""),
        (2, "git status # note\ngit commit -m x", repo, repo, ""),
        (2, "git add -A && echo issue#12 && git commit -m x", repo, repo, ""),
        (2, f"cd {repo}  # the session checkout\ngit commit -m x", wt, repo, ""),
        (2, "if ! git diff --cached --quiet; then git commit -m x; fi", repo, repo, ""),
        (2, "for f in a b; do git commit -m $f; done", repo, repo, ""),
        (2, "! git commit -m x", repo, repo, ""),
        (2, "sudo git commit -m x", repo, repo, ""),
        (2, "git commit -m \"$(cat <<'EOF'\nSupport the 27\" panel\nEOF\n)\"", repo, repo, ""),
        (2, 'echo "oops\ngit commit -m x', repo, repo, ""),
        (2, f"git -C $(git -C {repo} rev-parse --show-toplevel) commit -m x", wt, repo, "cannot tell"),
        (2, f"git -C `git -C {repo} rev-parse --show-toplevel` commit -m x", wt, repo, "cannot tell"),
        (2, "git \\\ncommit -m x", repo, repo, ""),
        (2, f"pushd {repo} && git commit -m x", wt, repo, ""),
        (0, "cat > notes.md <<'EOF'\nRun this in the worktree:\ngit commit -m x\nrm -rf data\nEOF\ngit status",
         repo, repo, ""),
        (2, "cat > notes.md <<-EOF\n\tnotes\n\tEOF\ngit commit -m x", repo, repo, ""),
        (2, "rm -rf data", plain, plain, "data is precious"),
        (1, "ls", plain, plain, "guard line 2 is not a valid regular expression"),
        (1, None, repo, repo, "could not read the hook input"),
    ]
    env = dict(os.environ, HOME=tmp)
    env.pop("TORYO_UNSET", None)
    failed = 0
    for want, command, cwd, project, word in cases:
        stdin = "not json" if command is None else json.dumps(
            {"tool_name": "Bash", "cwd": cwd, "tool_input": {"command": command}})
        run = subprocess.run([sys.executable, os.path.abspath(__file__)], input=stdin, text=True,
                             capture_output=True, env=dict(env, CLAUDE_PROJECT_DIR=project))
        ok = run.returncode == want and word in run.stderr
        failed += not ok
        shown = (command or "<not json>").replace("\n", "\\n").replace(tmp, "<tmp>")
        got = "" if ok else f"  (got {run.returncode}: {run.stderr.strip()})"
        print(f"{'ok  ' if ok else 'FAIL'} {want} {shown}{got}")
    shutil.rmtree(tmp, ignore_errors=True)
    print("self-test: clean" if not failed else f"self-test: {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(self_test() if sys.argv[1:] == ["--self-test"] else main())
