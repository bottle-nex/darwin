# GitHub Onboarding & Context Flow

darwin gives its agent context about a project through a **thin project brief** (an
auto-generated `CLAUDE.md`-style doc) plus **live exploration** of the cloned code
inside an ephemeral E2B runner. No vector index, no code graph — the live filesystem
is always the source of truth; the brief just saves the agent its orientation cost.

## Flow A — Connect the repo (runs once, then on demand)

The expensive work (runner + LLM) is triggered by an explicit "this is my target"
confirmation — never by the moment access is granted. Three distinct moments:

1. **Authorize** — GitHub App install / OAuth callback grants scoped access. Record
   tokens + which repos are visible. No repo/branch decided yet, no runner. (This is
   the existing "connect" controller — it does nothing expensive.)
2. **Link repo + pick branch** — a separate controller. Cheap GitHub API read lists the
   repo's branches; pre-select the repo's default branch, let the user override (so a
   non-`main`/`master` branch is fully supported). Save `repo`, `trackedBranch` (their
   choice), and that branch's `HEAD` SHA. Switching the tracked branch later re-runs
   this step — one trigger, no special cases.
3. **Confirm → onboard (async)** — the link step enqueues an "onboard project" job;
   set `briefStatus: pending`. UI stays instant.
4. **Spin up an E2B runner** — shallow-clone the tracked branch.
5. **Run the onboarding agent** — fixed prompt: explore the repo and produce the brief
   in a fixed schema (stack, layout, entry points, build/test, conventions, domain glossary).
6. **Persist the brief** — store to Postgres against the project with
   `briefCommitSha = HEAD`, `briefGeneratedAt = now`, `briefStatus: ready`. Tear down the runner.

**Which controller starts the runner:** not the connect/authorize controller — the
"link repo & set branch" controller. It validates the branch exists, saves the target,
then enqueues onboarding.

## UI — where the branch picker lives

Repo linking is not a field on the create form; it's a small reusable **Repository
surface** the create dialog borrows (a project can have no repo, or add/change one later).

- **In the Create Project dialog:** clicking **IMPORT** selects the repo and reveals a
  **Branch** dropdown inline (fetched via GitHub API, preselected to the repo's default
  branch, overridable). "Create Project" links the repo + enqueues onboarding on the
  chosen branch.
- **Instant create, async onboard:** the modal never blocks on the runner. After create,
  the board shows an **"Analyzing repository…"** state until `briefStatus: ready`.
- **Changing branch later:** a small Repository section on the project page re-selects the
  tracked branch and re-triggers onboarding (same "link repo & set branch" controller).

## Flow B — Issue picked up from the board

1. **Claim** — issue parked on the Kanban board; agent claims it.
2. **Staleness check (cheap, no LLM)** — compare current default-branch SHA to
   `briefCommitSha`. Small/no drift → reuse brief. Big drift → regenerate (Flow A steps 3-5) first.
3. **Spin up a fresh E2B runner** — clone at current HEAD (or the target branch).
4. **Assemble context** — issue text + stored brief injected into the system prompt + tools (grep/read/edit/run).
5. **Work the issue** — agent edits against live code, then runs the project's own
   build/test (the brief told it how) to validate.
6. **Open the PR** — raise the PR back to the repo, update the board card, tear down the runner.

## The tie

- **Flow A** = learn the project once, cache the high-level map cheaply.
- **Flow B** = per issue, grab a fresh sandbox, hand the agent the map + live code, let it work.
- The **staleness check** is the only bridge: it decides whether Flow B triggers a mini Flow A first.
- The runner in both flows is the **same primitive** — an E2B sandbox with the repo cloned and an
  agent inside; onboarding is just that agent pointed at "describe" instead of "fix."
