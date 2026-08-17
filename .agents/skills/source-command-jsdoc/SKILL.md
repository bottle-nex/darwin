---
name: "source-command-jsdoc"
description: "Write JSDoc for files edited but not yet staged, matching the project's doc style"
---

# source-command-jsdoc

Use this skill when the user asks to run the migrated source command `jsdoc`.

## Command Template

Add JSDoc comments to every file this branch has changed relative to `main`.

## 1. Find the target files

Run all three — the **union** is the file set to document:

```bash
git diff --name-only main...HEAD               # files changed on this branch vs main (merge-base)
git diff --name-only                            # uncommitted unstaged edits
git ls-files --others --exclude-standard        # untracked (new) files
```

`main...HEAD` uses the merge-base, so it captures "what this branch changed," not changes that landed on `main` since you branched. This covers committed work _and_ in-progress edits in one pass.

Only `.ts`/`.tsx`/`.js`/`.jsx` source files — skip configs, JSON, markdown, lockfiles. If `main` doesn't exist locally, fall back to `origin/main`.

If the set is empty, say so and stop.

## 2. Learn this project's JSDoc convention first

Before writing anything, read 2-3 already-documented files near the targets (same directory or layer) to absorb the house style. In this repo the established pattern lives in:

- `apps/server/src/controllers/auth/controller.verify-otp.ts` and `controller.generate-otp.ts` — class + handler docs
- `apps/server/src/services/service.jwt.ts` — function docs with `@param` / `@returns` / `@throws`

Match what you find there, specifically:

- A **one-line class summary** on each exported class (`/** HTTP controller for ... */`).
- A **method/function doc** on each public handler/function describing: the route it handles (e.g. `POST /auth/...`), what it does, any non-obvious behavior (cooldowns, fire-and-forget, upsert-as-signup, normalization), and a terse `Responses:` line listing status codes + domain error codes.
- Use `@param` / `@returns` / `@throws` on standalone service functions (see `service.jwt.ts`), but the controller handlers use prose + a `Responses:` line instead.
- 4-space indent, double quotes, `printWidth: 100` — keep doc lines under 100 cols.

Do not invent a new style; mirror the closest existing file.

## 3. Write the docs

- Only **add** JSDoc — do not change logic, imports, or formatting of code lines.
- Don't document trivial private helpers or obvious one-liners; focus on exported classes, handlers, and functions.
- If a file already has JSDoc, leave it; only fill in what's missing.

## 4. Report

List each file touched and what you documented. Run `bun run format:check` on nothing destructive — just remind me to run `bun run lint`/`format` before pushing if relevant. Do not stage or commit.
