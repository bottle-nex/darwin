# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product

**matcha** (trymatcha) is an autonomous, agentic engineering platform built around a **canvas/board** where teams file issues — and an LLM agent picks them up, implements the fix, and raises a PR end-to-end.

The flow we're building toward:

1. **Board (canvas)** — organizations and their teams drop issues onto a shared board (Kanban-style; see `LandingKanbanBoard`). Each issue belongs to a project.
2. **Agent pickup** — an LLM agent claims issues from the board and works them autonomously: understand the issue, change the code, verify it.
3. **Code runners** — sandboxed, ephemeral compute ("DevOps" runners) that clone and actually **run the target project's codebase** so the agent can build, test, and validate its changes against the real project before shipping.
4. **PR** — the agent opens a pull request from the runner with the implemented fix, back to the company's repo for human review.

The org → project → team → member hierarchy (with GitHub-style roles) in the Prisma schema exists to scope who can file issues and who owns which projects/repos the runners operate on. The work-item (issue/card) domain that lives on the board is not yet modeled — when building it, treat the board issue as the unit the agent consumes and the PR as its output.

This vision is **directional** — much of it (runners, agent orchestration, the issue domain) is not built yet. What's shipped today is auth (email-OTP + OAuth) and the org/team scaffolding. Don't assume a feature exists; verify in code.

## Stack & layout

Bun-managed Turborepo monorepo. `bun@1.3.2` is pinned via `packageManager`; use `bun` (not npm/yarn/pnpm) for installs and scripts.

- `apps/web` — Next.js 16 (App Router) + React 19 + Tailwind v4 + shadcn/ui (`new-york` style, lucide icons). Uses `@/*` path alias to the web app root. Zustand for client state, Lenis for smooth scroll (wired via `providers/LenisProvider`), Motion for animation.
- `apps/server` — Express 5 API run on the **Bun runtime** (`bun run --watch src/index.ts`). ESM (`"type": "module"`). Top-level `await` is used in `src/index.ts`; do not rewrap it in an IIFE.
- `packages/database` — Prisma schema + client. Prisma generates the client into `packages/database/generated/client` (gitignored). The package's `exports["."]` is `src/client.ts`, which re-exports everything from the generated client. Always import via `@trymatcha/database`, not from `../generated/client`.
- `packages/config-eslint`, `packages/config-typescript` — shared configs (`@trymatcha/eslint-config`, `@trymatcha/typescript-config`).

Local infra is `docker-compose up -d`: Postgres 16 on `:5433` and Redis 7 with `notify-keyspace-events Ex` on `:6379` (the Redis flag is required — OTP/expiry logic relies on it).

## Environment

There is **one `.env` at the repo root**. Both the server and Prisma load it from there explicitly:

- `apps/server/src/configs/env.ts` resolves `../../../../.env` relative to itself and validates with a Zod schema in `ENV`. Server keys are prefixed `SERVER_*`. Missing/invalid vars print a formatted error and `process.exit(1)`.
- `packages/database/prisma.config.ts` loads `../../.env` and passes `DATABASE_URL` to Prisma via `env()`.

Do not create per-app `.env` files (the README's `cp .env.example` steps are stale — the gitignore still excludes them but the config no longer reads them). Add new env vars to `.env.example`, the Zod schema in `configs/env.ts`, and reference via `ENV.<NAME>`.

## Commands

Run from repo root unless noted; Turbo fans out to workspaces.

```bash
bun install                  # install all workspaces
bun run dev                  # turbo dev — runs web (next dev) and server (bun --watch) in parallel
bun run build                # turbo build
bun run lint                 # turbo lint (eslint . --max-warnings 0 per package)
bun run typecheck            # turbo typecheck (tsc --noEmit per package)
bun run format               # prettier write across the repo
bun run format:check         # prettier check (pre-push gate)

bun run db:migrate:dev       # prisma migrate dev (interactive — prompts for name)
bun run db:migrate:deploy    # prisma migrate deploy (production)
bun run db:push              # prisma db push (no migration file)
bun run db:seed              # tsx packages/database/src/seed.ts
bun run generate             # prisma generate — also runs automatically as predev/prebuild in @trymatcha/database
```

Scope a turbo task to one workspace with a filter, e.g. `bun run dev --filter=web` or `bun run typecheck --filter=@trymatcha/server`.

Prisma Studio: `cd packages/database && bun run studio`.

There is **no test runner configured yet** — don't claim a test pass without one.

## Pre-push hook

`.husky/pre-push` blocks pushes on `format:check`, `lint`, `typecheck` failing (in that order). Run them yourself before pushing to avoid surprise rejections. Do not bypass with `--no-verify`.

## Server architecture

Entry: `apps/server/src/index.ts` — `await RedisService.connect()` runs at module scope, then Express is wired with CORS (`origin: ENV.SERVER_WEB_URL`, `credentials: true`) and mounts `v1_router` at `/api/v1`.

Layout under `apps/server/src`:

- `configs/` — env loading + validation.
- `routers/v1/router.v1.ts` — versioned root; mounts subrouters (`/auth`, etc.) and exposes `GET /health`.
- `routers/<feature>/router.<feature>.ts` — feature subrouters; wire URLs only, no business logic.
- `controllers/<feature>/controller.<action>.ts` — one file per action; default-exports a class with a static handler. Controllers validate input with Zod, call services, and respond via `ResponseWriter`.
- `services/` — stateless helpers (single-class-per-file): `service.otp.ts` (Redis-backed OTP lifecycle), `service.email.ts` (Resend), `service.jwt.ts` (HS256 session tokens), `service.redis.ts`, `service.response.ts`.

**Response envelope** — every endpoint must return through `ResponseWriter` (`services/service.response.ts`). It writes a uniform `{ success, data?, message, error?: { code, details? }, url?, meta: { timestamp } }` shape. Use the named helpers (`success`, `created`, `not_authorized`, `not_found`, `too_many_requests`, `invalid_data`, `system_error`) when one fits, and `custom(...)` for domain codes like `OTP_COOLDOWN` / `OTP_LOCKED` / `OTP_EXPIRED` / `OTP_INVALID`. Do not call `res.json` / `res.status` directly from controllers.

**Auth flow** is passwordless email OTP backed by Redis:

1. `POST /api/v1/auth/otp/request` — generate a 6-digit code, bcrypt-hash it, store under `otp:<email>` with TTL `SERVER_OTP_TTL_SECONDS`, arm a `:cooldown` key, and fire-and-forget the Resend email (rolling back stored state on delivery failure).
2. `POST /api/v1/auth/otp/verify` — increments `:attempts` on every try, locks (and wipes the code) after `SERVER_OTP_MAX_ATTEMPTS`, and on success upserts the user (setting `emailVerified`) and returns a signed session JWT (`signSessionJwt` from `service.jwt`, HS256, TTL `SERVER_JWT_TOKEN_TTL`).

When adding endpoints that issue/consume codes, route through `OtpService` rather than touching Redis keys directly — the key naming and lifecycle assumptions live there.

## Database

Schema: `packages/database/prisma/schema.prisma` — Postgres, `prisma-client-js` generator outputting to `../generated/client`. The runtime client is built in `src/client.ts` using `@prisma/adapter-pg` with a `pg` `Pool` (not the default driver), and cached on `globalThis` outside production to survive HMR.

Migrations live in `packages/database/prisma/migrations`. When changing the schema:

1. Edit `schema.prisma`.
2. `bun run db:migrate:dev` from the root — it generates the SQL migration, applies it, and re-runs `prisma generate`.
3. Commit both the schema change and the new migration folder.

`db:push` is acceptable for throwaway iteration only; never use it instead of a migration on shared branches.

## Web

Next.js App Router (`apps/web/app`). Currently shipped routes: `/` (landing) and `/playground/[projectId]`. shadcn config (`components.json`) sets `style: new-york`, base color `neutral`, components alias `@/components/ui`, utils `@/lib/utils`. When adding shadcn components, generate into `components/ui/` to match.

Tailwind v4 is configured via `app/globals.css` + `@tailwindcss/postcss` — there is no `tailwind.config.*`. Theme tokens and animations live in `globals.css`.

## Conventions

Optimize every change for the next reader: the simplest thing that works, named so its intent is obvious. Prefer restructuring to fit a feature cleanly over bolting logic onto existing shapes, and don't reach for a complicated mechanism when a plain one does the job.

- **No comments** — do not write code comments. No JSDoc on new types, props, constants or functions, no inline `//` notes, no "why" blocks. Names carry the intent; if a line needs explaining, rename or restructure it instead. This is strict and applies to every file and language in the repo. Comments already in a file stay unless the code they describe is being deleted — don't add new ones alongside them.
- **Icons** — never hand-pick a `react-icons` import. Before adding an icon, grep for how that concept is already drawn and reuse the exact same import: a calendar is `HiCalendar`, a status circle comes from `KanbanBoard.COLUMNS`, a priority glyph from `PRIORITY_OPTIONS`. Two glyphs for one concept (the sidebar's calendar differing from the card's) is a real defect, not a nitpick. If a shared map exists, extend it rather than choosing locally; if nothing exists, pick one deliberately and say so — it becomes the canonical one. The same rule covers the colours attached to those icons.
- **Naming** — pick meaningful, self-explanatory names for variables, functions, files, and types. A name should tell you what the thing is without reading its body.
- **React files** — every component file is `PascalCase.tsx` (e.g. `CreateProjectDialog.tsx`). App Router route files (`page.tsx`, `layout.tsx`, `route.ts`) stay lowercase per Next.js.
- **Types** — shared/domain types live in `apps/web/types/` (or the `@trymatcha/types` package for cross-app types), named `<domain>.type.ts` (e.g. `kanban.type.ts`, `board.type.ts`). Keep component-local `Props` inline; promote a type to the folder once more than one file needs it.
- **Zustand** — one small, single-purpose store per concern under `apps/web/store/<feature>/use<Feature>Store.ts`. Don't funnel unrelated state into a single mega-store. Server data stays in React Query hooks (`apps/web/hooks/`), not Zustand.

## Formatting

Prettier (`.prettierrc.json`): 4-space indent, double quotes, semicolons, `trailingComma: "all"`, `printWidth: 100`, LF line endings. Match this when writing/editing files — `format:check` runs in the pre-push hook.

Server / database code style: classes with `static` methods (see `OtpService`, `ResponseWriter`, controller classes), snake_case for method names in services/controllers (`store_otp`, `not_authorized`), camelCase elsewhere. Follow the existing convention in the file you're touching.
