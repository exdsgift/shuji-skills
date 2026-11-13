#!/usr/bin/env python3
"""toryo-loop guard: a Claude Code PreToolUse hook on Bash.

Refuses (exit 2, the reason on stderr) a git commit whose checkout is on the default branch, a `git worktree add`
past the setup file's worktree cap, and any command matching a line of the setup file's ```guard block. It reads the
command's words the way the shell would to find where each commit acts; when those words do not account for every
`git commit` the raw text names, it refuses rather than guesses. It catches slips, not an agent set on getting round it.
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
PATH_OPTIONS = {"-C", "--work-tree"}  # options whose value moves the checkout a git call acts on
GIT_VALUE_OPTIONS = {"-c", "--git-dir", "--namespace", "--config-env", "--super-prefix", "--attr-source"}
HEREDOC = re.compile(r"(?<!<)<<(?!<)(-?)\s*(['\"]?)([A-Za-z_][\w.-]*)\2")
_VALUE = "|".join(re.escape(o) for o in sorted(PATH_OPTIONS | GIT_VALUE_OPTIONS))
_GIT = (r"(?<![\w.-])git(?:[ \t]+(?:(?:" + _VALUE + r")[ \t]+(?:\"[^\"]*\"|'[^']*'|\S+)|-\S+))*[ \t]+")
RAW_COMMIT = re.compile(_GIT + r"[\"']?commit[\"']?(?![\w-])")
RAW_WORKTREE_ADD = re.compile(_GIT + r"[\"']?worktree[\"']?[ \t]+[\"']?add[\"']?(?![\w-])")
# a word that changes directory or runs text the hook does not read, anywhere in the raw text
RAW_MOVES = re.compile(r"(?<![\w.$/-])(?:cd|pushd|popd|eval|source)(?![\w.-])|(?:^|[;&|(\n])[ \t]*\.[ \t]")
SUBST = "$TORYO_SUBST"  # a $(...) or backtick span: its value is unknown to the hook
GIT_ENV = re.compile(r"^(GIT_DIR|GIT_WORK_TREE)=")
SETTERS = {"export", "declare", "typeset", "readonly", "local"}


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


def opaque(command):
    """What the raw scan reads, heredoc bodies included: the text with each `...` and $(...) span made one word,
    then the inside of each span, read the same way."""
    spans = []
    text = re.sub(r"`([^`]*)`", lambda m: spans.append(m.group(1)) or SUBST, command.replace("\\\n", " "))
    while True:
        shorter = re.sub(r"\$\(([^()]*)\)", lambda m: spans.append(m.group(1)) or SUBST, text)
        if shorter == text:
            return [text] + spans
        text = shorter


def strip_heredocs(command):
    """Drop heredoc bodies before lexing: their quotes are data and would unbalance the line that opens them."""
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
    lexer.commenters = ""  # a comment is read as words: dropping text could drop a cd
    return list(lexer)


def tokens(command):
    """Words and separators, with shell quoting undone, after dropping heredoc bodies and line continuations."""
    text = strip_heredocs(command).replace("\\\n", " ")
    try:
        return lex(text)
    except ValueError:  # an unbalanced quote: read the line that has it word by word, never skip a line
        out = []
        for line in text.split("\n"):
            try:
                out += lex(line)
            except ValueError:
                out += [w.strip("'\"") for w in re.findall(r"[;&|()]+|[^\s;&|()]+", line)]
            out.append("\n")
        return out


def prefix(words):
    """The variable settings a command makes, and the words that name it: leading assignments, keywords, wrappers
    and the wrappers' options come off the front; what `export`, `declare`, `readonly` and the like set is kept."""
    found, rest = [], list(words)
    while rest:
        if re.match(r"^[A-Za-z_]\w*=", rest[0]):
            found.append(rest.pop(0))
        elif rest[0] in KEYWORDS:
            rest.pop(0)
        elif rest[0] in WRAPPERS:
            rest.pop(0)
            while rest and rest[0].startswith("-"):
                rest.pop(0)
        else:
            break
    if rest and rest[0] in SETTERS:
        found += [w for w in rest[1:] if not w.startswith("-")]
    return found, rest


def resolve(path, base):
    """An absolute path, or None when it depends on what the hook cannot see: it expands `~` and `$HOME` only, so a
    path with any other variable, `~-`, `~+`, `~N`, a `$(...)` or backticks, or a glob is unknown."""
    home = os.path.expanduser("~")
    path = re.sub(r"\$(HOME\b|\{HOME\})", lambda _: home, path)
    if path == "~" or path.startswith("~/"):
        path = home + path[1:]
    if any(c in path for c in "$`*?[~"):
        return None
    if os.path.isabs(path):
        return os.path.normpath(path)
    return None if base is None else os.path.normpath(os.path.join(base, path))


def git_call(words, where):
    """("commit" or "worktree add", the checkout it acts on) for those two git calls, else None."""
    i = 1
    while i < len(words) and words[i].startswith("-"):
        word = words[i]
        if word in PATH_OPTIONS and i + 1 < len(words):
            where = resolve(words[i + 1], where)
            i += 2
        elif word.startswith("--work-tree="):
            where = resolve(word.split("=", 1)[1], where)
            i += 1
        elif word == "--git-dir" or word.startswith("--git-dir="):
            where = None
            i += 1 if "=" in word else 2
        elif word in GIT_VALUE_OPTIONS:
            i += 2
        else:
            i += 1
    sub = words[i] if i < len(words) else ""
    if sub == "commit":
        return "commit", where
    if sub == "worktree" and words[i + 1:i + 2] == ["add"]:
        return "worktree add", where
    return None


def read(command, cwd, moves):
    """The simple commands the shell would run, and each commit and worktree-add call with every checkout it may
    act on (None for one the hook cannot see). The hook does not follow `cd`: when the command has a word that moves
    the shell or runs unread text (`moves`), a checkout not written as an absolute `-C` is unknown."""
    here = frozenset([cwd, None]) if moves else frozenset([cwd])
    words, depth, commands, calls, git_env = [], 0, [], [], False
    for token in tokens(command) + [";"]:
        separator = bool(token) and set(token) <= set(PUNCTUATION)
        if depth:  # inside an unquoted $(...): it stays one opaque word of the command around it
            if not separator:
                continue
            rest = ""
            for ch in token:
                if depth:
                    depth += (ch == "(") - (ch == ")")
                else:
                    rest += ch
            if not rest:
                continue
            token = rest  # shlex glues ")" to the separator after it
        if separator and "(" in token and words and words[-1].endswith("$"):
            words[-1] += "(...)"
            depth = token.count("(") - token.count(")")
            continue
        if not separator:
            words.append(token)
            continue
        settings, command_words = prefix(words)
        git_env = git_env or any(GIT_ENV.match(w) for w in settings)  # it moves every later git call
        if command_words:
            commands.append(command_words)
            if os.path.basename(command_words[0]) == "git":
                placed = [git_call(command_words, None if git_env else base) for base in here]
                if placed[0]:
                    where = {None} if git_env else {w for _, w in placed}
                    calls.append((placed[0][0], frozenset(where)))
        words = []
    return commands, calls


def check(command, cwd, project):
    """Raise Refuse for the first refusal; return the setup file's problems otherwise."""
    default, cap, guards, problems = setup_values(project)
    raws = opaque(command)
    commands, calls = read(command, cwd, any(RAW_MOVES.search(raw) for raw in raws))
    pieces = [p.strip(" \t({!") for raw in raws for p in re.split(r"[;&|\n]+", raw)]
    for pattern, reason in guards:
        for text in [" ".join(c) for c in commands] + pieces:
            if text and pattern.search(text):
                raise Refuse(f"{reason} (pattern: {pattern.pattern}).")
    commits = [wheres for kind, wheres in calls if kind == "commit"]
    if len(commits) < sum(len(RAW_COMMIT.findall(raw)) for raw in raws):
        raise Refuse("this command names a `git commit` the guard cannot place. Run the commit on its own, as "
                     "git -C /absolute/path commit, and pass any text that names one through a file.")
    adds = [wheres for kind, wheres in calls if kind == "worktree add"]
    if any(RAW_WORKTREE_ADD.search(raw) for raw in raws) and not adds:
        adds = [frozenset([cwd])]
    commits = [where for wheres in commits for where in wheres]
    adds = [cwd if where is None else where for wheres in adds for where in wheres]  # one worktree list per repo
    for where in commits:
        if where is None:
            raise Refuse("cannot tell which checkout this git call acts on. Write its path out: git -C /absolute/path.")
    for where in commits:
        branch = git(where, "symbolic-ref", "--short", "HEAD")
        base = default or re.sub(r"^origin/", "", git(where, "symbolic-ref", "--short", "refs/remotes/origin/HEAD"))
        if branch and branch == (base or "main"):
            raise Refuse(f"a commit on {branch} in {where}. Commit in the ticket's worktree: git -C <worktree> commit.")
    for where in adds:
        listing = git(where, "worktree", "list", "--porcelain")
        count = sum(line.startswith("worktree ") for line in listing.splitlines()) - 1
        if listing and count >= cap:
            raise Refuse(f"{count} worktrees already, the cap is {cap}. Remove a merged one first (git worktree list).")
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
    on_main, unplaced = "Commit in the ticket's worktree", "cannot place"

    def slip(cd_line):  # a comment ")" inside a case, which the reader misreads; the raw cd scan must hold anyway
        return (f"(\n  {cd_line}\n  case \"$1\" in\n    # 1) nothing to do\n    *) git fetch -q . ;;\n  esac\n"
                "  git commit -m x\n)")

    cases = [  # expected exit, command, cwd, project, a word the message must hold
        (2, "git commit -m x", repo, repo, on_main),
        (0, f"git -C {wt} commit -m x", repo, repo, ""),
        (2, f"git -C {repo} commit -m x", wt, repo, on_main),
        (0, "git commit -m x", wt, repo, ""),
        (2, f"cd {repo} && git commit -m x", wt, repo, "cannot tell"),
        (2, f"cd '{repo}' && git commit -m x", wt, repo, "cannot tell"),
        (2, f"cd {repo}; git commit -m x", wt, repo, "cannot tell"),
        (2, f"cd {repo}\ngit commit -m x", wt, repo, "cannot tell"),
        (2, f"(cd {repo} && git status) && git commit -m x", wt, repo, "cannot tell"),
        (0, f"(cd {repo} && git status) && git -C {wt} commit -m x", wt, repo, ""),
        (0, f"cd {wt}/docs; git -C {wt} commit -m x", repo, repo, ""),
        (2, f"git -C {wt} status && git commit -m x", repo, repo, on_main),
        (0, f"git -C {repo} fetch origin && git -C {wt} commit -m x", wt, repo, ""),
        (2, "git -c user.name=a commit -m x", repo, repo, on_main),
        (2, "GIT_EDITOR=true git --no-pager commit -m x", repo, repo, on_main),
        (2, "git -C ~/repo commit -m x", wt, repo, on_main),
        (2, 'git -C "$TORYO_UNSET" commit -m x', wt, repo, "cannot tell which checkout"),
        (0, "git log --grep commit", repo, repo, ""),
        (2, 'echo "git commit -m x"', repo, repo, unplaced),
        (2, f'git -C "{other}" commit -m x', repo, other, "a commit on trunk"),
        (2, "git worktree add ../wt-y -b feat/y", repo, repo, "the cap is 1"),
        (0, "git worktree add ../o-wt -b feat/o", other, other, ""),
        (2, "rm -rf data/cache", repo, repo, "not regenerable"),
        (2, "git push origin main --force", repo, repo, "operator's"),
        (2, "git push -f origin main", repo, repo, "operator's"),
        (2, "git push origin +main", repo, repo, "operator's"),
        (0, "git push origin feat/x && git checkout -f main", repo, repo, ""),
        (2, "git status # note\ngit commit -m x", repo, repo, on_main),
        (2, "git add -A && echo issue#12 && git commit -m x", repo, repo, on_main),
        (2, f"cd {repo}  # the session checkout\ngit commit -m x", wt, repo, "cannot tell"),
        (2, "if ! git diff --cached --quiet; then git commit -m x; fi", repo, repo, on_main),
        (2, "for f in a b; do git commit -m $f; done", repo, repo, on_main),
        (2, "! git commit -m x", repo, repo, on_main),
        (2, "sudo git commit -m x", repo, repo, on_main),
        (2, "git commit -m \"$(cat <<'EOF'\nSupport the 27\" panel\nEOF\n)\"", repo, repo, on_main),
        (0, f"git -C {wt} commit -m \"$(cat <<'EOF'\nSupport the 27\" panel\nEOF\n)\"", repo, repo, ""),
        (2, 'echo "oops\ngit commit -m x', repo, repo, on_main),
        (2, f"git -C $(git -C {repo} rev-parse --show-toplevel) commit -m x", wt, repo, "cannot tell"),
        (2, f"git -C `git -C {repo} rev-parse --show-toplevel` commit -m x", wt, repo, "cannot"),
        (2, "git \\\ncommit -m x", repo, repo, on_main),
        (2, f"pushd {repo} && git commit -m x", wt, repo, "cannot tell"),
        (2, "git add $(git ls-files -m)\ngit commit -m x", repo, repo, on_main),
        (0, f"git -C {wt} add $(git ls-files -m)\ngit -C {wt} commit -m x", repo, repo, ""),
        (2, "echo $(date);git commit -m x", repo, repo, on_main),
        (2, "echo '`x` done' && git commit -m y", repo, repo, on_main),
        (0, f"echo '`x` done' && git -C {wt} commit -m y", repo, repo, ""),
        (2, 'python3 -c "print(1 << n)"\ngit commit -m x', repo, repo, unplaced),
        (2, "echo $((1<<N))\ngit commit -m x", repo, repo, ""),
        (2, "ls # don't skip\ngit commit -m x # can't wait", repo, repo, ""),
        (2, "sudo -u bob git commit -m x", repo, repo, unplaced),
        (2, "nice -n 10 git commit -m x", repo, repo, unplaced),
        (2, "cat > notes.md <<'EOF'\nRun this in the worktree:\ngit commit -m x\nEOF", repo, repo, unplaced),
        (2, "cat > notes.md <<'EOF'\nrm -rf data\nEOF", repo, repo, "not regenerable"),
        (0, "cat > notes.md <<'EOF'\nRun the tests first, don't skip them.\nEOF\ngit status", repo, repo, ""),
        (2, "cat > notes.md <<-EOF\n\tnotes\n\tEOF\ngit commit -m x", repo, repo, on_main),
        (0, f"gh pr merge 87 --merge --match-head-commit 3f2a9c1 && git -C {wt} status", repo, repo, ""),
        (2, "out=$(git commit -m x 2>&1); echo \"$out\"", repo, repo, unplaced),
        (2, "$(git commit -m x)", repo, repo, unplaced),
        (2, 'echo "$(git commit -m x)"', repo, repo, unplaced),
        (2, "R=`git commit -m x`", repo, repo, unplaced),
        (2, "out=$(git push --force origin main 2>&1)", repo, repo, "operator's"),
        (2, "cd /no/such/dir\ngit commit -m x", repo, repo, "cannot tell"),
        (2, f"cd {os.path.join(tmp, 'wt-typo')}; git commit -m x", repo, repo, "cannot tell"),
        (2, "[ -d /no/such ] && cd /no/such; git commit -m x", repo, repo, "cannot tell"),
        (2, f"false && cd {wt}; git commit -m x", repo, repo, "cannot tell"),
        (2, f"if [ -d {wt} ]; then cd {wt}; fi; git commit -m x", repo, repo, "cannot tell"),
        (2, f"pushd {wt} && git status && popd && git commit -m x", repo, repo, "cannot tell"),
        (2, f"cd {wt} && git commit -m x", repo, repo, "cannot tell"),
        (0, f"git -C {wt} fetch origin && git -C {wt} commit -m x", repo, repo, ""),
        (2, f"git -C {wt} fetch origin && cd {wt} && git commit -m x; git commit -m y", repo, repo, "cannot tell"),
        (2, f"cd {wt}\ngit add -A\ngit commit -m x", repo, repo, "cannot tell"),
        (2, f"if false; then echo hi; cd {wt}; fi; git commit -m x", repo, repo, "cannot tell"),
        (2, f'if [ -n "$CI" ]; then\ncd {wt}\nfi\ngit commit -m x', repo, repo, "cannot tell"),
        (2, f"for d in; do\ncd {wt}\ndone\ngit commit -m x", repo, repo, "cannot tell"),
        (2, f"(cd {wt} && false) && cd {wt} && git add -A; git commit -m x", repo, repo, "cannot tell"),
        (2, f"cd {wt} & git commit -m x", repo, repo, "cannot tell"),
        (2, f"cd {wt} | cat; git commit -m x", repo, repo, "cannot tell"),
        (2, f"cd {wt}/typo/..; git commit -m x", repo, repo, "cannot tell"),
        (2, f"git status # clean; cd {wt} next\ngit commit -m x", repo, repo, "cannot tell"),
        (2, f"cd {wt}; cd -; git commit -m x", repo, repo, ""),
        (2, "cd -- -; git commit -m x", wt, repo, "cannot tell"),
        (2, "cd -P -; git commit -m x", wt, repo, "cannot tell"),
        (2, f"( cd {repo}; case x in x) git commit -m x ;; esac )", wt, repo, "cannot tell"),
        (0, f"case x in x) echo hi ;; esac; git -C {wt} commit -m x", repo, repo, ""),
        (2, f'eval "cd {repo}"; git commit -m x', wt, repo, "cannot tell"),
        (2, f"source env.sh; git commit -m x", wt, repo, "cannot tell"),
        (2, f"GIT_DIR={repo}/.git git commit -m x", wt, repo, "cannot tell"),
        (2, f"export GIT_WORK_TREE={repo}; git commit -m x", wt, repo, "cannot tell"),
        (2, f'git -C {wt} "commit" -m a; sudo -u bob git commit -m b', repo, repo, unplaced),
        (0, f'cd "$TORYO_UNSET" && git -C {wt} commit -m x', repo, repo, ""),
        (0, f'eval "$TORYO_UNSET"; git -C {wt} commit -m x', repo, repo, ""),
        (0, f"source env.sh && git -C {wt} commit -m x", repo, repo, ""),
        (0, f'git -C {wt} commit -m "GIT_DIR=x is only text here"', repo, repo, ""),
        (0, f"env | grep GIT_DIR= ; git -C {wt} commit -m x", repo, repo, ""),
        (2, f"env GIT_DIR={repo}/.git git commit -m x", wt, repo, "cannot tell"),
        (2, f"declare -x GIT_DIR={repo}/.git; git commit -m x", wt, repo, "cannot tell"),
        (0, f"case x in x) ( cd {repo} && true ); git -C {wt} commit -m x ;; esac", wt, repo, ""),
        (2, f"case x in\nx) cd {repo} ;;\nesac\ngit commit -m x", wt, repo, "cannot tell"),
        (2, f"case x in\n  y) true ;;\n  x) git -C {repo} commit -m x ;;\nesac", wt, repo, on_main),
        (2, "cd ~-; git commit -m x", wt, repo, "cannot tell"),
        (2, "git -C ~- commit -m x", wt, repo, "cannot tell"),
        (2, f"(\n  cd {repo}\n  case \"$1\" in\n    # 1) nothing to do\n    *) git fetch -q . ;;\n  esac\n"
         "  git commit -m x\n)", wt, repo, "cannot tell"),
        (2, f"(\n  cd {repo}\n  case x in\n    a) : ;;  # the a) arm\n  esac\n  git commit -m x\n)", wt, repo,
         "cannot tell"),
        (2, f"case x in (a) : ;; esac\ncd {repo}\ncase y in\n  # y) the only arm\n  y) : ;;\nesac\ngit commit -m x",
         wt, repo, "cannot tell"),
        (2, f"( cd {repo}; echo hi # done)\ngit commit -m x )", wt, repo, "cannot tell"),
        (0, "git commit -m x # done", wt, repo, ""),
        (2, f"( cd {repo}; v=$(case a in a) echo 1 ;; esac); git commit -m x )", wt, repo, "cannot tell"),
        (2, f"( cd {repo}; v=$(case a in a) echo 1 ;; b) echo 2 ;; esac); git commit -m x )", wt, repo, "cannot tell"),
        (2, f"( cd {repo}; v=`case a in a) echo 1 ;; esac`; git commit -m x )", wt, repo, "cannot tell"),
        (0, f"( cd {repo}; v=$(case a in (a) echo 1 ;; esac) ); git -C {wt} commit -m x", wt, repo, ""),
        (2, f"readonly GIT_DIR={repo}/.git; export GIT_DIR; git commit -m x", wt, repo, "cannot tell"),
        (2, f"local GIT_DIR={repo}/.git; git commit -m x", wt, repo, "cannot tell"),
        (0, f"( cd {repo} && case x in (x) git status >/dev/null ;; esac ) ; git -C {wt} commit -m x", wt, repo, ""),
        (2, f"pushd {repo}; pushd {wt}; git -C ~1 commit -m x", wt, repo, "cannot tell"),
        (2, f'cd {repo}; git -C "$PWD" commit -m x', wt, repo, "cannot tell"),
        (2, f"cd {repo}; git -C ${{OLDPWD}} commit -m x", wt, repo, "cannot tell"),
        (2, f'msg="$(printf "%s # %s" a b)"; cd {repo}\ngit commit -m x', wt, repo, "cannot tell"),
        (2, f'echo "$(echo "a # b")" && cd {repo}\ngit commit -m x', wt, repo, "cannot tell"),
        (2, f"echo \\ #x; cd {repo}\ngit commit -m x", wt, repo, "cannot tell"),
        (2, f"echo ${{x:-a #b}}; cd {repo}\ngit commit -m x", wt, repo, "cannot tell"),
        (2, f"echo $'it\\'s' ' # '; cd {repo}\ngit commit -m x", wt, repo, ""),
        (2, f"v=`echo \\`date\\` `\ncd {repo}\necho '`'\ngit commit -m x", wt, repo, ""),
        (2, f"shopt -s extglob\n( cd {repo}\ncase x in @(a|x)) : ;; esac\ngit commit -m x )", wt, repo, ""),
        (2, f"# note \\\ncd {repo}\ngit commit -m x", wt, repo, "cannot tell"),
        (0, f"( cd {repo} && case x in\n(a) : ;;\n(x) git status >/dev/null ;;\nesac ) ; git -C {wt} commit -m x",
         wt, repo, ""),
        (0, f"( cd {repo} && case x in (a) : ;;(x) git status ;; esac ) ; git -C {wt} commit -m x", wt, repo, ""),
        (0, f"v=$(case a in\n(a) echo 1 ;;\n(b) echo 2 ;;\nesac)\ngit -C {wt} commit -m x", repo, repo, ""),
        (2, slip('cd "$(git rev-parse --git-common-dir)/.."'), wt, repo, "cannot tell"),
        (2, slip(f"cd `git -C {repo} rev-parse --show-toplevel`"), wt, repo, "cannot tell"),
        (2, slip('cd "$HOME"/repo'), wt, repo, "cannot tell"),
        (2, slip(f'cd "{wt}"/../repo'), wt, repo, "cannot tell"),
        (2, slip("cd a; cd b; cd ../../../repo"), wt, repo, "cannot tell"),
        (2, f"cd {repo}*; git commit -m x", wt, repo, "cannot tell"),
        (2, f"git -C {repo}* commit -m x", wt, repo, "cannot tell"),
        (2, f"cd >/dev/null {repo}; git commit -m x", wt, repo, "cannot tell"),
        (2, f"pushd > /dev/null {repo}; git commit -m x", wt, repo, "cannot tell"),
        (2, slip(f"cd >/dev/null 2>&1 {repo}"), wt, repo, "cannot tell"),
        (0, f"cd >/dev/null {repo}; git -C {wt} commit -m x", wt, repo, ""),
        (2, slip("cd ~/r\\(1\\)"), wt, repo, "cannot tell"),
        (2, slip("cd"), wt, repo, "cannot tell"),
        (2, f"cd &>/dev/null {repo}; git commit -m x", wt, repo, "cannot tell"),
        (2, f"cd >& /dev/null {repo}; git commit -m x", wt, repo, "cannot tell"),
        (2, f"cd >| /dev/null {repo}; git commit -m x", wt, repo, "cannot tell"),
        (2, f'X={repo}; git -C "$X" commit -m x', wt, repo, "cannot tell"),
        (2, ". ./env.sh; git commit -m x", wt, repo, "cannot tell"),
        (0, "git add . && git commit -m x", wt, repo, ""),
        (0, f"git -C {wt} add . && git -C {wt} commit -m x", repo, repo, ""),
        (0, f"cd {repo} && git -C {wt} commit -m x", repo, repo, ""),
        (2, f"git -C {wt} --attr-source HEAD commit -m a; sudo -u bob git commit -m b", repo, repo, unplaced),
        (2, f"git --git-dir={repo}/.git commit -m x", wt, repo, "cannot tell"),
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
