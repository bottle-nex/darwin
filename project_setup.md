# Project Setup Architecture

How a connected GitHub repo gets onboarded into darwin — cloned, stood up, verified,
and made ready for the agent to start solving issues. This is the design we settled
on; it is directional, not all built yet.

---

## 1. What "setup" means

When an org connects a repo to a project, darwin must learn two completely different
kinds of context about it:

- **Comprehension context** — _what the code does._ Embeddings + a curated
  "repo map" so the agent understands the codebase. Cheap, no execution.
- **Runnable context** — _how to build / run / test it._ Detect dependencies and
  services, collect secrets, get the project to a **known-green baseline**, and
  freeze that. This is the hard part and the focus of this doc.

The runnable side is hard because a user's repo runs on _their_ machine thanks to
**implicit state** (installed tools, shell env vars, local DBs, private registry
access) that isn't in the repo. Setup is the act of forcing that implicit state to
become **explicit**.

---

## 2. First-time onboarding pipeline

Order matters — env vars can't be collected before we know which ones the repo needs.

1. **Connect** — repo selected, GitHub App installed (already built), `SetupSession`
   created.
2. **Provision** — spin up an E2B sandbox.
3. **Clone** — clone the repo into the sandbox.
4. **Detect** — the agent reads the repo and figures out what it needs:
    - `docker-compose.yml` → required services (Postgres, Redis, …)
    - `.github/workflows` / CI → the real install / build / test commands
    - `.env.example` / `process.env.X` usage → the env-var manifest
    - package manager, monorepo layout ("which app?"), runtime versions
    - This produces **`infrastructure.md`** — the runnable analog of CLAUDE.md.
5. **Collect secrets** — present the detected env-var manifest to the user; they fill
   in secret values; we encrypt + store them (vault).
6. **Boot services + install** — `docker compose up`, install deps, run migrations.
7. **Verify (baseline green)** — actually run the build + test suite once. **Success
   is not "the dev server boots" — it's "build passes and tests are green."** That
   green state is what every future agent PR measures itself against. If it can't go
   green, flag the user rather than silently continuing.
8. **Snapshot** — once green, **snapshot the sandbox** (deps installed, services up,
   env wired). Every future issue-run _restores this warm snapshot_ instead of
   re-deriving setup. The messy, drift-prone work happens **once**, with a human
   nearby, and never again per-issue.
9. **Persist + keep fresh** — store the context pack (embeddings + `infrastructure.md`
    - command manifest + baseline status). Webhooks re-index incrementally on push.

> **`infrastructure.md` is proven, not guessed.** The agent doesn't just _read_ the
> repo and write a doc — it actually runs the commands, hits errors, fixes them, and
> only a clean run produces the trusted `infrastructure.md`.

---

## 3. Where things run (the core architecture)

There are **three** machines:

| Machine                   | Runs                                                                     |
| ------------------------- | ------------------------------------------------------------------------ |
| **Anthropic**             | The Claude model (the brain). Always here, reached over HTTPS.           |
| **Your Server** (Express) | The orchestrator — drives the agent loop, mediates everything.           |
| **E2B sandbox**           | A clean Linux box that runs shell commands: `npm install`, `git`, tests. |

The model is always at Anthropic. The choice is **where the agent loop runs**:

- **Design A — Claude Code CLI runs _inside_ E2B.** Natural mental model; the agent
  lives in the box with the project. But the box also runs **untrusted repo code**
  (npm postinstall, build, tests), so any secret in the box — including the Anthropic
  key — can be exfiltrated by a malicious dependency. And asking the user means
  "shouting out" of the box.
- **Design B — the loop runs on your Server; E2B is just hands.** Your server runs
  the loop and makes the Anthropic calls; when Claude says "run npm install," the
  server executes it _in_ the sandbox via E2B's SDK. The key never enters the box, and
  asking the user is trivial because the server already mediates every tool call.

### The key-security rule (applies to either design)

**Never put the real org-wide Anthropic key in the sandbox.** Either:

1. Run the loop on the server (Design B), so LLM calls never touch the box, **or**
2. If the CLI runs in the box (Design A), point it at a **proxy**:
   `ANTHROPIC_BASE_URL = https://yourserver.com/anthropic-proxy` with a short-lived,
   **spend-capped, per-session token**. Your server holds the real key, injects it,
   and forwards. The box never sees the real key; worst-case blast radius is one
   session.

Bake the _tooling_ (Claude Code / SDK, git, runtimes) into the E2B template; inject
any token at sandbox launch, **never into the image**.

> **Buy-vs-build note:** Anthropic **Managed Agents** gives most of this out of the
> box — hosted agent loop, per-session container, repo cloning, a credential **vault**
> (secrets substituted at egress, never in the sandbox), **Outcomes** (rubric-graded
> verify loop = baseline-green), and PR creation via GitHub MCP. Worth spiking before
> building the full E2B rig by hand.

---

## 4. Human-in-the-loop: how the agent asks the user

When setup gets stuck on something only the user knows (a secret, a choice, a
confirm), the agent must ask. **~⅓ of repos won't settle on the agent's first pass** —
this channel is the recovery path, not an edge case.

### Principle: asking is a structured _tool_, not parsed text

Give the agent a tool `ask_user(type, key, prompt, options)`. When stuck, it **calls
the tool** instead of guessing. The call is the signal and carries typed args.

### Principle: the DATABASE is the source of truth, not the connection

The pending question lives in a DB row. Transport (polling / SSE / WebSocket) is just
how each side learns the row changed. This makes it durable — survives a page refresh,
a dropped socket, or a server restart.

### The flow (example: repo needs a private npm token)

```
1. Agent runs:        npm install        → 401 on @acme/ui
2. Agent calls tool:  ask_user("NeedSecret", "NPM_TOKEN", "paste your npm token")
3. Server:            INSERT setup_questions row (status=Waiting)
                      push to browser
                      pause the run
4. Browser:           renders a MASKED field (because type=NeedSecret)
5. User submits:      POST /setup/:id/answer { key: "NPM_TOKEN", value: "npm_xxx" }
6. Server:            encrypt → vault; flip row to Answered; (secret never logged)
                      resume agent, inject NPM_TOKEN into the sandbox env
7. Agent retries:     npm install → ✓
```

### Two channels

- **Box → Server** (the agent asking out): the `ask_user` handler **long-polls**
  `GET /sandbox/:id/pending-answer?key=...`; the server holds it open until the row
  flips to `Answered`.
- **Server → Browser** (surfacing it): see transport below.

### Transport — don't over-engineer

| Stage                       | Server → Browser | Why                                                                                                                                            |
| --------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **MVP (build first)**       | **Polling**      | Browser hits `GET /setup/:id/state` every ~2s, reads the DB row. Dead simple, survives refresh. Setup takes minutes — 2s latency is invisible. |
| **Polish**                  | **SSE**          | Server _pushes_ state over one long-lived HTTP connection. Answers still go back via plain POST. Drop-in — same DB.                            |
| **Only for free-form chat** | **WebSocket**    | Overkill for structured asks.                                                                                                                  |

### Suspend, don't block live

A user might take minutes or hours to answer. Don't keep a live API loop + sandbox
blocked — **checkpoint the agent and pause/snapshot the sandbox** when it asks, resume
when the answer arrives (same snapshot machinery as the warm baseline).

### Escalation ladder

1. **Agent auto-fix** (bounded by attempts / time / token budget) — mechanical drift.
2. **Ask the user** (the `ask_user` tool above) — information drift (secrets, access,
   undocumented steps). **The single most important recovery mechanism.**
3. **Human takeover** — a web terminal into the same sandbox; capture whatever they
   did as the source of truth.
4. **Degraded state** — mark the project "setup unverified"; comprehension still
   works, just no verified auto-PRs. Never hard-fail the whole connection.

---

## 5. The ask taxonomy (what the LLM can ask, what the user sees)

Each is a `type` on the `SetupQuestion` row; the frontend switches on `type` to render
the widget.

| `type`          | Fires when…                                                               | User sees                     | Answer to |
| --------------- | ------------------------------------------------------------------------- | ----------------------------- | --------- |
| `NeedSecret`    | real credential (`DATABASE_URL`, registry token)                          | masked password field         | 🔒 vault  |
| `NeedValue`     | non-secret config (port, base URL, test email)                            | plain text field              | row       |
| `NeedChoice`    | ambiguity w/ options (which app, which start cmd, branch, node version)   | dropdown / radio              | row       |
| `Confirm`       | risky/irreversible action (run migration, run `make`, postinstall script) | Yes / No (show command)       | row       |
| `NeedFile`      | a file not in git (local `.env`, service-account JSON, seed dump)         | file upload                   | 🔒 vault  |
| `NeedAccess`    | external access (private npm/GitHub registry, private submodule)          | masked token / Connect button | 🔒 vault  |
| `DefineSuccess` | what "running" means (dev boots? tests green? `/health` 200?)             | choice + text                 | row       |
| `Clarify`       | catch-all free text (two compose files — which dev one?)                  | free text box                 | row       |
| `ApproveCost`   | setup blew past time/token budget — keep going?                           | Yes / No (show cost)          | row       |

- Only `NeedSecret`, `NeedFile`, `NeedAccess` route the answer to the **vault**;
  everything else lives in the row. That's the one branch the `/answer` handler cares
  about.
- The three you'll hit constantly: **`NeedChoice`** (monorepo "which app?"),
  **`Confirm`** (don't run a stranger's `make`/migration silently), **`NeedSecret`**
  (env vars). `Clarify` is the safety net so the agent is never truly stuck.

---

## 6. Data model (Prisma)

In `packages/database/prisma/schema.prisma`. Three models: `SetupSession` (one setup
run), `SetupQuestion` (one pending ask), `ProjectSecret` (encrypted vault,
project-scoped).

- **The secret value never lives on `SetupQuestion`** — a secret answer creates a
  `ProjectSecret` (encrypted) and the question keeps `secretId` only. Non-secret
  answers go in `answerValue`.
- **`ProjectSecret` is project-scoped**, reused on every future issue-run.
- **AES-256-GCM → three columns** (`ciphertext`, `iv`, `authTag`). The encryption key
  lives in the **server env / KMS, never in the DB** — a DB leak alone exposes nothing.
- **`@@index([sessionId, status])`** makes the "any waiting questions?" poll cheap.

`SetupSession.status` walks: `Pending → Provisioning → Cloning → Detecting →
InstallingDeps → BootingServices → (WaitingOnUser) → Verifying → Ready | Failed`.

---

## 7. Settle ratio (how often setup just works)

For a random repo connected by a real user:

| Stage                                 | Settles green | Why                                                            |
| ------------------------------------- | ------------- | -------------------------------------------------------------- |
| Agent alone, first pass               | **~60–70%**   | Conventional stacks w/ Dockerfile/compose/CI + `.env.example`. |
| + user supplies a secret / one answer | **~80–85%**   | Most failures are a missing secret or one quick answer.        |
| + human terminal takeover             | **~90–95%**   | Weird build steps, version pins, undocumented setup.           |
| Irreducible fails                     | **~5–10%**    | VPN-only services, proprietary infra, hardware deps.           |

**Plan for ~⅓ of repos to not settle on the first agent pass** — that's why the
escalation ladder exists. The biggest lever between 60% and 90% is **secrets +
private dependencies**.

---

## 8. Purchasing & cost

### Buy the **Anthropic API**, not a subscription

- There is no separate "Claude Code API" — you fund an **Anthropic API account**
  (console.anthropic.com); Claude Code authenticates against it.
- **Prepaid credits + auto-reload** to start. Note: rate limits are **tier-based and
  scale with cumulative spend** — for real concurrent-issue volume, talk to Anthropic
  sales for higher limits + **committed-use discounts**. Set spend alerts.
- Subscriptions (Pro/Max/Team) are for interactive human use, **not** multi-tenant
  programmatic backends. (From 2026-06-15, `claude -p` / Agent SDK usage on
  subscriptions draws from a separate, limited monthly credit — explicitly walled off
  from what we'd be doing.)

### COGS per issue (the agent is the COGS; E2B is noise)

| Issue   | Model                    | Sandbox    | E2B cost    | Token cost       | All-in      |
| ------- | ------------------------ | ---------- | ----------- | ---------------- | ----------- |
| Easy    | Sonnet                   | 5–15 min   | ~$0.03      | $0.50–2          | **~$1–2**   |
| Medium  | Sonnet (+Opus if stalls) | 20–40 min  | ~$0.10      | $3–8             | **~$3–8**   |
| Complex | Opus                     | 60–120 min | ~$0.30–0.60 | $15–50 (sticker) | **~$15–50** |

- **Tokens are ~90% of COGS; E2B is cents** — stop optimizing the sandbox.
- **Current pricing:** Opus 4.8 = **$5 in / $25 out** per MTok; Sonnet 4.6 = $3/$15;
  Haiku 4.5 = $1/$5. (Opus premium over Sonnet is ~1.7× on output, not 5×.)
- **Three levers, in order of impact:**
    1. **Model routing** — default Sonnet, escalate to Opus only on stall/complexity.
    2. **Prompt caching** — the agent re-reads the same repo context every turn; cache
       it (system prompt + `infrastructure.md` + context) for ~90% off cached input.
    3. **Feed embeddings instead of cold exploration** — the comprehension layer is a
       direct COGS lever: jump to the 3 relevant files instead of grepping the whole
       repo. (Also: batch API = 50% off for non-urgent issues.)
- **Blended average with routing on: ~$3–5/issue**, realistically lower (~$2–4) with
  caching + embeddings. Autonomy is what costs more than the interactive Claude Code
  experience — the agent has to _buy_ with tokens the context a human gives for free.
- **Margin control:** enforce a **per-issue budget cap** (~$15–20); when a run blows
  it, escalate/stop instead of burning. Onboarding burns tokens with no billable
  "resolved issue" — cover it with a one-time setup fee or quota.

### Pricing model (bill on outcome, not tokens)

The unit is a **resolved issue** = a PR that passed the project's own tests
(green baseline). Failed attempts that escalate to a human are **not billed**.

| Tier (per project / month) | Price  | Included issues | Overage      |
| -------------------------- | ------ | --------------- | ------------ |
| Starter                    | $99    | 20              | $10–15/issue |
| Team                       | $499   | 150             | $10–15/issue |
| Scale                      | $1,999 | 750             | $10–15/issue |

Free trial: 1 repo, 5 resolved issues. Anchor against an engineer (~$8–12k/mo) — the
ROI story is 10–20×, so there's large pricing headroom. Set **overage to ~2–3× blended
COGS** so complex overage issues don't lose money; the included quota absorbs the
easy/medium mix at healthy margin.

---

## 9. Build order

1. **Schema** (done) — `SetupSession`, `SetupQuestion`, `ProjectSecret`.
2. **Encryption helper** (AES-256-GCM) + key in server env / `.env.example` + Zod.
3. **Setup orchestrator** — server drives the loop, E2B as executor, proxy for the key.
4. **`ask_user` tool + routes** — `/sandbox/:id/ask`, `/setup/:id/state` (poll),
   `/setup/:id/answer`, `/sandbox/:id/pending-answer` (long-poll).
5. **Frontend** — poll `state`, render widgets by `type` (start with masked field,
   dropdown, Yes/No).
6. **Verify + snapshot** — baseline-green gate, warm snapshot.
7. **Upgrade** transport polling → SSE; add human-terminal takeover.
