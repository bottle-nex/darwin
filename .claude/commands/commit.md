---
description: Write a Conventional Commit message (subject + body) from the current changes and commit immediately
argument-hint: "[optional hint about intent]"
---

Write a Conventional Commit message for the current changes and commit it **immediately** — do not ask me to approve first.

## 1. Inspect what's being committed

```bash
git status --short
git diff HEAD
```

- Always stage **everything** first with `git add -A`, then commit all changed files
  in a **single** commit. Do not split changes across multiple commits, and do not
  commit only the already-staged subset.

Read the actual diff to understand _what changed_ — never write the message from filenames alone.

## 2. Message — Conventional Commits with body

```
<type>(<optional scope>): <summary>

<body — what & why, wrapped at ~72 cols>
```

- **subject** (line 1):
    - **type**: `feat` | `fix` | `refactor` | `chore` | `docs` | `style` | `test` | `perf` | `build` | `ci`
    - **scope** (optional): area touched — `auth`, `otp`, `server`, `web`, `db`, `config`, etc. Infer from paths.
    - imperative mood, lowercase, no trailing period, ≤ 50 chars.
- **blank line**, then the **body**:
    - Explain _what changed and why_ — not a file-by-file restatement of the diff.
    - Wrap lines at ~72 cols. A few sentences or short bullets is plenty.
    - For a truly trivial change (typo, formatting) the body may be a single line.
- If the diff spans unrelated concerns, pick the dominant change for the subject and cover the rest in the body.

If I passed a hint after the command (`$ARGUMENTS`), use it to steer intent/scope.

## 3. Commit

Commit directly with two `-m` flags (`-m "<subject>" -m "<body>"`) — no confirmation. Do **not** push. Never use `--no-verify`. Print the final message and short SHA after.
