# Next.js Product Diff Adapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reliably generate Product Diffs for standalone Next.js applications and Next.js applications inside Turborepo and Nx workspaces, with precise business-facing diagnostics and a framework-adapter boundary ready for Vite + React.

**Architecture:** Keep `ProductDiffRunner` framework-neutral: it checks out revisions, delegates preparation and lifecycle to a selected adapter, captures verified previews, pairs them, and publishes artifacts. `NextProductDiffAdapter` owns Next application selection, workspace command resolution, router-safe preview surface generation, startup diagnostics, and cleanup; sandbox-local inspection and scaffolding stay in `@trydarwin/preview-runner`.

**Tech Stack:** Bun, TypeScript, Zod, Prisma/Postgres, BullMQ, E2B, Next.js, Playwright, React 19, TanStack Query.

**Spec:** `docs/superpowers/specs/2026-08-24-next-product-diff-adapter-design.md`

## Global Constraints

- Deliver Next.js support first: standalone, workspace, Turborepo, and Nx; do not implement Vite in this plan.
- Preserve existing published Product Diff artifacts and manifest versions.
- Use Bun for all repository commands and Bun test for new unit tests.
- Add no code comments or JSDoc; names and structure must explain intent.
- Use focused files only; do not create `utils.ts`, `helpers.ts`, `manager.ts`, or a new catch-all Product Diff service.
- Execute customer repository commands only in the E2B sandbox with generated placeholder environment values and redacted diagnostics.
- Never create App Router and Pages Router preview routes for the same attempt.
- Generate job-scoped preview paths and remove all generated files on success, retry, failure, and cancellation.
- Rebuild and verify the E2B template whenever `packages/preview-runner` changes.
- Vite + React is the next adapter after this plan; keep all core interfaces framework-neutral.

---

## File Structure

```text
apps/vm/src/services/
  service.product_diff.ts                              core orchestration only
  service.preview_deps.ts                              consume workspace installation plan
  service.preview_server.ts                            start an adapter-provided command and probe path
  service.preview_workspace.ts                         checkout, placeholder env, and tracked cleanup
  product_diff/
    adapter.contract.ts                                adapter, workspace, preview, diagnostic contracts
    adapter.registry.ts                                Next adapter selection
    service.preview_lifecycle.ts                       start, verify, stop, and cleanup one revision
    adapters/next/
      service.next_product_diff_adapter.ts             Next adapter lifecycle
      service.next_workspace_resolver.ts               standalone, Turborepo, and Nx application resolution
      service.next_preview_launcher.ts                 validated Next launch command construction
      service.next_preview_surface.ts                  unique App Router or Pages Router preview surface

packages/preview-runner/src/
  contract.ts                                          framework-neutral command contracts
  index.ts                                             commands selected by adapter request
  adapters/next/
    workspace.ts                                       filesystem-only Next and workspace inspection
    preview_surface.ts                                 filesystem-only route creation and removal
  browser.ts                                           shared browser validation
  check.ts                                             required validation before capture

packages/types/product-diff/
  product-diff.contract.ts                             outcome codes and persisted diagnostics types

packages/database/prisma/schema/
  product_diff.prisma                                  statuses and diagnostic JSON
  project.prisma                                       optional preview configuration

apps/server/src/
  controllers/project/controller.get_product_diff.ts   expose diagnostic summary
  controllers/project/controller.update_project_config.ts
  services/service.product_diff.ts                     queue eligibility and retryable statuses

apps/web/
  types/project.ts                                     preview configuration types
  hooks/project/useUpdateProjectConfig.ts              partial configuration update
  components/playground/Review/diff/DiffReviewDisplay.tsx
                                                      outcome-specific review states
```

## Task 1: Persist Product Diff outcome codes and safe diagnostic summaries

**Files:**
- Modify: `packages/database/prisma/schema/product_diff.prisma`
- Modify: `packages/database/prisma/schema/project.prisma`
- Create: `packages/database/prisma/migrations/<timestamp>_add_product_diff_preview_diagnostics/migration.sql`
- Modify: `packages/types/product-diff/product-diff.contract.ts`
- Modify: `apps/server/src/services/service.product_diff.ts`
- Test: `apps/server/src/services/service.product_diff.test.ts`

**Interfaces:**
- Produces `ProductDiffStatus.ConfigurationRequired` and `ProductDiffStatus.PreviewUnavailable`.
- Produces `ProductDiffDiagnostic { code, stage, message, adapter, applicationPath, workspaceKind }`.
- Produces `ProductDiffPreviewConfiguration { applicationPath, launchCommand, healthPath, visualRoutes }` stored as nullable JSON on `ProjectConfig`.

- [ ] **Step 1: Write failing status-mapping tests**

```ts
import { expect, test } from "bun:test";
import ProductDiffService from "./service.product_diff";

test("retryable_product_diff_status excludes configuration-required runs", () => {
    expect(ProductDiffService.retryable_product_diff_status("PreviewUnavailable")).toBe(true);
    expect(ProductDiffService.retryable_product_diff_status("ConfigurationRequired")).toBe(false);
});
```

- [ ] **Step 2: Run the new test and confirm it fails because the mapper does not exist**

Run: `bun test apps/server/src/services/service.product_diff.test.ts`

Expected: failure referring to `retryable_product_diff_status`.

- [ ] **Step 3: Add the schema and migration**

Add `ConfigurationRequired` and `PreviewUnavailable` to `ProductDiffStatus`. Add nullable `diagnostics Json?` to `ProductDiff`. Add nullable `productDiffPreviewConfig Json?` to `ProjectConfig`. Generate a Prisma migration with explicit `ALTER TYPE` and `ALTER TABLE` statements, then run `bun run generate`.

- [ ] **Step 4: Define durable shared types and retry policy**

Add the exact diagnostic and configuration interfaces to `packages/types/product-diff/product-diff.contract.ts`. Add `ProductDiffService.retryable_product_diff_status(status)` returning true only for `Failed` and `PreviewUnavailable`. Update regeneration so it resets only those statuses.

- [ ] **Step 5: Run the focused test and type checks**

Run: `bun test apps/server/src/services/service.product_diff.test.ts`

Run: `bun run typecheck --filter=@trydarwin/server --filter=@trydarwin/types --filter=@trydarwin/database`

Expected: all pass.

- [ ] **Step 6: Commit the persistence contract**

```bash
git add packages/database/prisma/schema/product_diff.prisma packages/database/prisma/schema/project.prisma packages/database/prisma/migrations packages/types/product-diff/product-diff.contract.ts apps/server/src/services/service.product_diff.ts apps/server/src/services/service.product_diff.test.ts
git commit -m "feat: record Product Diff preview outcomes"
```

## Task 2: Define the framework-neutral adapter contract and registry

**Files:**
- Create: `apps/vm/src/services/product_diff/adapter.contract.ts`
- Create: `apps/vm/src/services/product_diff/adapter.registry.ts`
- Create: `apps/vm/src/services/product_diff/adapter.contract.test.ts`
- Modify: `apps/vm/package.json`

**Interfaces:**
- Produces `ProductDiffAdapter` with `detect`, `resolve_workspace`, `prepare_revision`, `start_revision`, `verify_revision`, and `cleanup_revision` methods.
- Produces `ProductDiffWorkspacePlan` with `repositoryRoot`, `applicationPath`, `workspaceKind`, `installDirectory`, `launchCommand`, `healthPath`, and `router`.
- Produces `ProductDiffAdapterRegistry.resolve(input): ProductDiffAdapter | null`.

- [ ] **Step 1: Write failing registry tests**

```ts
import { expect, test } from "bun:test";
import ProductDiffAdapterRegistry from "./adapter.registry";

test("returns the first adapter that supports a repository", async () => {
    const adapter = await ProductDiffAdapterRegistry.resolve({ workspaceRoot: "/repo", changedPaths: [] });
    expect(adapter?.id).toBe("next");
});
```

- [ ] **Step 2: Run the test and confirm it fails because the registry does not exist**

Run: `bun test apps/vm/src/services/product_diff/adapter.contract.test.ts`

Expected: module resolution failure.

- [ ] **Step 3: Implement the contracts without Next-specific fields in the core**

Define explicit input/output types for adapter detection, workspace resolution, prepared revisions, running previews, health checks, and diagnostics. Keep `nextAppDir`, `AppRoute`, `PagesEscape`, and shell command construction out of these types.

- [ ] **Step 4: Add a registry with the Next adapter as its only registration**

The registry iterates registered adapters in deterministic order and returns the first supported adapter. It returns null only when no adapter supports the repository. Add `"test": "bun test src"` to `apps/vm/package.json`.

- [ ] **Step 5: Run adapter tests and VM typecheck**

Run: `bun test apps/vm/src/services/product_diff/adapter.contract.test.ts`

Run: `bun run typecheck --filter=@trydarwin/vm`

Expected: all pass.

- [ ] **Step 6: Commit the adapter boundary**

```bash
git add apps/vm/src/services/product_diff apps/vm/package.json
git commit -m "feat: add Product Diff adapter contract"
```

## Task 3: Build deterministic Next workspace resolution

**Files:**
- Create: `packages/preview-runner/src/adapters/next/workspace.ts`
- Create: `packages/preview-runner/src/adapters/next/workspace.test.ts`
- Modify: `packages/preview-runner/src/contract.ts`
- Modify: `packages/preview-runner/src/index.ts`
- Modify: `apps/vm/src/services/service.preview_runner.ts`
- Create: `apps/vm/src/services/product_diff/adapters/next/service.next_workspace_resolver.ts`
- Create: `apps/vm/src/services/product_diff/adapters/next/service.next_workspace_resolver.test.ts`

**Interfaces:**
- Produces `NextWorkspaceInspection { workspaceKind, packageManager, applications, changedApplicationPaths }` from the sandbox filesystem.
- Produces `NextApplicationCandidate { applicationPath, packageName, router, hasPagesDirectory }`.
- Produces `NextWorkspaceResolver.resolve(inspection, changedPaths, configuration): ProductDiffWorkspacePlan | ProductDiffDiagnostic`.

- [ ] **Step 1: Write fixture-backed failing inspection tests**

```ts
test("finds a Next application in a pnpm Turborepo", () => {
    const inspection = inspect_next_workspace(fixtureRoot("turbo-next"), ["packages/ui/Hero.tsx"]);
    expect(inspection.workspaceKind).toBe("Turborepo");
    expect(inspection.applications).toEqual([
        expect.objectContaining({ applicationPath: "apps/marketing", packageName: "@acme/marketing" }),
    ]);
});

test("reports ambiguous shared-package changes instead of selecting an app", () => {
    const result = resolve_next_workspace(twoAppInspection, ["packages/ui/Button.tsx"], null);
    expect(result).toMatchObject({ code: "APPLICATION_SELECTION_AMBIGUOUS" });
});
```

- [ ] **Step 2: Run tests and confirm the new inspection command is absent**

Run: `bun test packages/preview-runner/src/adapters/next/workspace.test.ts apps/vm/src/services/product_diff/adapters/next/service.next_workspace_resolver.test.ts`

Expected: import or command failure.

- [ ] **Step 3: Implement filesystem inspection**

Detect root lockfiles, `pnpm-workspace.yaml`, `turbo.json`, `nx.json`, `workspace.json`, `project.json`, and all package manifests outside ignored directories. Identify Next applications from package dependencies and router folders. Do not retain the existing depth-four application scan. Return structured observations; do not choose an application in the sandbox command.

- [ ] **Step 4: Implement VM-side selection rules**

Choose an application when changed paths belong to exactly one app. Use explicit `productDiffPreviewConfig.applicationPath` first. Return `APPLICATION_SELECTION_AMBIGUOUS` when shared code or multiple apps leaves more than one valid application. Build workspace-root install and launch-plan metadata for standalone, Turborepo, and Nx.

- [ ] **Step 5: Run all resolver tests and preview-runner typecheck**

Run: `bun test packages/preview-runner/src/adapters/next/workspace.test.ts apps/vm/src/services/product_diff/adapters/next/service.next_workspace_resolver.test.ts`

Run: `bun run typecheck --filter=@trydarwin/preview-runner --filter=@trydarwin/vm`

Expected: all pass.

- [ ] **Step 6: Commit workspace resolution**

```bash
git add packages/preview-runner/src apps/vm/src/services/product_diff/adapters/next apps/vm/src/services/service.preview_runner.ts
git commit -m "feat: resolve Next Product Diff workspaces"
```

## Task 4: Replace hardcoded Next startup with validated launch plans

**Files:**
- Create: `apps/vm/src/services/product_diff/adapters/next/service.next_preview_launcher.ts`
- Create: `apps/vm/src/services/product_diff/adapters/next/service.next_preview_launcher.test.ts`
- Modify: `apps/vm/src/services/service.preview_server.ts`
- Modify: `apps/vm/src/services/service.preview_deps.ts`
- Modify: `apps/vm/src/services/service.preview_workspace.ts`

**Interfaces:**
- Produces `NextPreviewLaunchPlan { command, workingDirectory, port, healthPath, environment }`.
- Changes `PreviewServer.start` to accept `NextPreviewLaunchPlan`, not `nextAppDir`.
- Changes dependency installation to consume `workspacePlan.installDirectory`.

- [ ] **Step 1: Write failing launch-plan tests**

```ts
test("uses the selected package script through pnpm filtering", () => {
    const plan = NextPreviewLauncher.create({
        workspaceKind: "Turborepo",
        packageManager: "pnpm",
        packageName: "@acme/marketing",
        applicationPath: "apps/marketing",
        port: 41337,
    });
    expect(plan.command).toBe("pnpm --filter @acme/marketing run dev -- --hostname 127.0.0.1 --port 41337");
});

test("rejects an override containing shell control operators", () => {
    expect(() => NextPreviewLauncher.validate_override("pnpm dev && curl bad.example")).toThrow();
});
```

- [ ] **Step 2: Run the tests and confirm the launcher is absent**

Run: `bun test apps/vm/src/services/product_diff/adapters/next/service.next_preview_launcher.test.ts`

Expected: module resolution failure.

- [ ] **Step 3: Implement a constrained launch planner**

Support known package-manager command forms, Turborepo package tasks, and Nx `serve` targets. Allow a project override only after validating it as a single command without redirects, pipelines, substitutions, or control operators. Quote filesystem paths. Pass the local port and host through approved argument forms; never concatenate an untrusted app path into an unquoted shell command.

- [ ] **Step 4: Make server and dependency services consume plans**

Replace direct `next dev` invocation with `PreviewServer.start(plan)`. Install from `workspacePlan.installDirectory`. Keep placeholder `.env` files at both repository root and selected application root. Preserve exact process handles for shutdown.

- [ ] **Step 5: Run launch tests and VM typecheck**

Run: `bun test apps/vm/src/services/product_diff/adapters/next/service.next_preview_launcher.test.ts`

Run: `bun run typecheck --filter=@trydarwin/vm`

Expected: all pass.

- [ ] **Step 6: Commit preview startup**

```bash
git add apps/vm/src/services/product_diff/adapters/next apps/vm/src/services/service.preview_server.ts apps/vm/src/services/service.preview_deps.ts apps/vm/src/services/service.preview_workspace.ts
git commit -m "feat: launch Next previews from workspace plans"
```

## Task 5: Create a router-safe preview surface and required browser validation

**Files:**
- Create: `packages/preview-runner/src/adapters/next/preview_surface.ts`
- Create: `packages/preview-runner/src/adapters/next/preview_surface.test.ts`
- Modify: `packages/preview-runner/src/scaffold.ts`
- Modify: `packages/preview-runner/src/check.ts`
- Modify: `packages/preview-runner/src/capture.ts`
- Create: `apps/vm/src/services/product_diff/adapters/next/service.next_preview_surface.ts`
- Create: `apps/vm/src/services/product_diff/service.preview_lifecycle.ts`

**Interfaces:**
- Produces `PreviewSurface { routePath, generatedFiles, router }`.
- Produces `PreviewHealth { ok, diagnostic }` only after `PreviewRunner.check` succeeds for the probe and every target state.
- `cleanup_revision` removes exactly `generatedFiles` in reverse path-depth order.

- [ ] **Step 1: Write failing router-isolation tests**

```ts
test("removes an App Router surface before creating a Pages Router surface", () => {
    const first = create_next_preview_surface(appRouterFixture, { runId: "run-a", router: "NextAppRouter" });
    remove_next_preview_surface(first);
    const second = create_next_preview_surface(appRouterFixture, { runId: "run-a", router: "NextPagesRouter" });
    expect(existsSync(first.generatedFiles[0]!)).toBe(false);
    expect(existsSync(second.generatedFiles[0]!)).toBe(true);
});

test("rejects a target that logs a console error before capture", async () => {
    const result = await check(failingTargetInput);
    expect(result.ok).toBe(false);
    expect(result.results[1]?.problem).toBe("ConsoleError");
});
```

- [ ] **Step 2: Run tests and confirm the lifecycle behavior is missing**

Run: `bun test packages/preview-runner/src/adapters/next/preview_surface.test.ts`

Expected: failure because the unique surface API does not exist.

- [ ] **Step 3: Implement unique, tracked surfaces**

Replace the fixed `darwin-preview` route segment with a validated job-scoped segment supplied by the VM. Generate only the router selected by the Next workspace plan. Return every generated file path. Remove `PagesEscape` as an implicit automatic fallback. Surface creation must reject a customer-path collision rather than overwrite customer files.

- [ ] **Step 4: Require browser validation before screenshot capture**

Call `PreviewRunner.check` after the probe route is healthy and after harness target generation. Treat HTTP errors, redirects, page errors, error overlays, console errors, missing roots, and empty roots as `PreviewUnavailable` diagnostics. Do not call capture after an unsuccessful check. Continue normalising advisory warnings, but append an explicit truncation warning whenever input is shortened.

- [ ] **Step 5: Run surface and preview-runner tests**

Run: `bun test packages/preview-runner/src/adapters/next/preview_surface.test.ts`

Run: `bun run typecheck --filter=@trydarwin/preview-runner --filter=@trydarwin/vm`

Expected: all pass.

- [ ] **Step 6: Commit preview surface lifecycle**

```bash
git add packages/preview-runner/src apps/vm/src/services/product_diff apps/vm/src/services/service.preview_runner.ts
git commit -m "feat: verify and isolate Next preview surfaces"
```

## Task 6: Migrate ProductDiffRunner to the Next adapter

**Files:**
- Modify: `apps/vm/src/services/service.product_diff.ts`
- Modify: `apps/vm/src/services/service.product_diff_artifacts.ts`
- Modify: `apps/vm/src/services/services.queue.ts`
- Create: `apps/vm/src/services/service.product_diff.test.ts`

**Interfaces:**
- `ProductDiffRunner.run(productDiffId)` delegates adapter selection, workspace resolution, revision lifecycle, and diagnostics.
- `ProductDiffArtifacts.build_manifest` receives adapter framework metadata and normalized diagnostics.
- Queue completion logs every terminal status rather than treating only `Failed` as an error.

- [ ] **Step 1: Write a failing orchestration test for a configuration-required result**

```ts
test("settles an ambiguous Next workspace as ConfigurationRequired", async () => {
    await ProductDiffRunner.run(productDiffId);
    expect(mockProductDiffUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: "ConfigurationRequired" }) }),
    );
});
```

- [ ] **Step 2: Run the test and confirm the old runner maps it to Unsupported**

Run: `bun test apps/vm/src/services/service.product_diff.test.ts`

Expected: assertion failure because the runner does not have the new state.

- [ ] **Step 3: Replace direct Next flow with adapter lifecycle calls**

Keep checkout, pull freshness checks, artifact upload, pairing, and sandbox shutdown in `ProductDiffRunner`. Move direct calls to `PreviewRunner.detect`, `PreviewServer.start`, scaffold fallback selection, and Next-specific reason strings into `NextProductDiffAdapter` and `ProductDiffPreviewLifecycle`.

- [ ] **Step 4: Persist concise diagnostics and preserve full redacted logs**

Set `ConfigurationRequired` for ambiguous selection or missing explicit configuration, `PreviewUnavailable` for project boot or browser-render failures, and `Failed` for Darwin failures. Store the structured diagnostic JSON and continue limiting the user-facing error string. Include adapter and workspace information in the manifest warnings only when a run reaches Ready.

- [ ] **Step 5: Run the orchestration test, VM typecheck, and formatter check**

Run: `bun test apps/vm/src/services/service.product_diff.test.ts`

Run: `bun run typecheck --filter=@trydarwin/vm`

Run: `bunx prettier --check apps/vm/src/services/service.product_diff.ts apps/vm/src/services/product_diff`

Expected: all pass.

- [ ] **Step 6: Commit core migration**

```bash
git add apps/vm/src/services/service.product_diff.ts apps/vm/src/services/service.product_diff_artifacts.ts apps/vm/src/services/services.queue.ts apps/vm/src/services/service.product_diff.test.ts apps/vm/src/services/product_diff
git commit -m "feat: run Product Diffs through Next adapter"
```

## Task 7: Expose configuration and meaningful statuses in the product

**Files:**
- Modify: `apps/server/src/controllers/project/controller.get_product_diff.ts`
- Modify: `apps/server/src/controllers/project/controller.get_project_config.ts`
- Modify: `apps/server/src/controllers/project/controller.update_project_config.ts`
- Test: `apps/server/src/controllers/project/controller.update_project_config.test.ts`
- Modify: `apps/web/types/project.ts`
- Modify: `apps/web/hooks/project/useUpdateProjectConfig.ts`
- Modify: `apps/web/components/playground/Review/diff/DiffReviewDisplay.tsx`

**Interfaces:**
- API returns `diagnostics` with Product Diff detail and `productDiffPreviewConfig` with project configuration.
- Project config patch accepts optional `product_diff_preview_config` without requiring `kanban_option_view`.
- Review UI displays `ConfigurationRequired` and `PreviewUnavailable` separately.

- [ ] **Step 1: Write failing controller validation tests**

```ts
test("accepts a product diff application override without a Kanban change", async () => {
    const response = await request(app)
        .patch(`/api/v1/projects/${projectId}/config`)
        .send({ product_diff_preview_config: { applicationPath: "apps/marketing", healthPath: "/" } });
    expect(response.status).toBe(200);
});

test("rejects a preview command containing a shell control operator", async () => {
    const response = await request(app)
        .patch(`/api/v1/projects/${projectId}/config`)
        .send({ product_diff_preview_config: { launchCommand: "pnpm dev && curl bad.example" } });
    expect(response.status).toBe(400);
});
```

- [ ] **Step 2: Run the controller test and confirm the payload is rejected**

Run: `bun test apps/server/src/controllers/project/controller.update_project_config.test.ts`

Expected: failure because the schema accepts only `kanban_option_view`.

- [ ] **Step 3: Implement API, types, and UI states**

Validate all override fields with Zod and reject unsafe launch commands. Return diagnostics from Product Diff detail. Update the settings mutation to send a partial configuration object. In `DiffReviewDisplay`, show “Needs preview setup” with the diagnostic message for ConfigurationRequired and “Preview could not start” with a retry action for PreviewUnavailable.

- [ ] **Step 4: Run focused server and web checks**

Run: `bun test apps/server/src/controllers/project/controller.update_project_config.test.ts`

Run: `bun run typecheck --filter=@trydarwin/server --filter=web`

Expected: all pass.

- [ ] **Step 5: Commit product-facing configuration**

```bash
git add apps/server/src/controllers/project apps/web/types/project.ts apps/web/hooks/project/useUpdateProjectConfig.ts apps/web/components/playground/Review/diff/DiffReviewDisplay.tsx
git commit -m "feat: configure and explain Product Diff previews"
```

## Task 8: Add fixture verification, ship the sandbox runtime, and gate rollout

**Files:**
- Create: `packages/preview-runner/fixtures/next-standalone/`
- Create: `packages/preview-runner/fixtures/next-turborepo/`
- Create: `packages/preview-runner/fixtures/next-nx/`
- Create: `packages/preview-runner/fixtures/next-ambiguous-workspace/`
- Create: `packages/preview-runner/fixtures/next-provider-failure/`
- Create: `apps/vm/src/scripts/script.verify_next_product_diff_fixtures.ts`
- Modify: `apps/vm/src/scripts/script.build_sandbox_template.ts`
- Modify: `apps/vm/src/scripts/script.verify_sandbox_template.ts`
- Modify: `apps/vm/src/scripts/script.product_diff_dry_run.ts`

**Interfaces:**
- Fixture verifier exits 0 only when standalone, Turborepo, and Nx inspections produce valid workspace plans and ambiguous/provider-failure fixtures produce expected diagnostic codes.
- Sandbox protocol version is incremented whenever preview-runner contract behavior changes.

- [ ] **Step 1: Create fixture expectations before implementation verification**

```ts
const expected = {
    "next-standalone": { workspaceKind: "Standalone", outcome: "Ready" },
    "next-turborepo": { workspaceKind: "Turborepo", outcome: "Ready" },
    "next-nx": { workspaceKind: "Nx", outcome: "Ready" },
    "next-ambiguous-workspace": { code: "APPLICATION_SELECTION_AMBIGUOUS" },
    "next-provider-failure": { status: "PreviewUnavailable" },
};
```

- [ ] **Step 2: Run the verifier and confirm missing fixtures fail**

Run: `bun run apps/vm/src/scripts/script.verify_next_product_diff_fixtures.ts`

Expected: failure naming the first absent fixture.

- [ ] **Step 3: Add minimal fixture repositories and verifier**

Keep fixtures small and local: no network images, external APIs, or secrets. Each fixture has a lockfile and a deterministic visual route. The provider-failure fixture intentionally imports an unavailable module and asserts a categorized diagnostic rather than a generic failure.

- [ ] **Step 4: Rebuild the sandbox bundle and template**

Run: `bun run build --filter=@trydarwin/preview-runner`

Increment the preview-runner protocol version in both VM and sandbox runtime when its command contract changes. Then run: `bun run template` and `bun run template:verify`.

- [ ] **Step 5: Run fixture verification and a dry run**

Run: `bun run apps/vm/src/scripts/script.verify_next_product_diff_fixtures.ts`

Run: `bun run apps/vm/src/scripts/script.product_diff_dry_run.ts --issue <known-next-fixture-issue> --pull <pull-number> --base <sha> --head <sha>`

Expected: Ready for the supported fixture and categorized terminal states for each negative fixture.

- [ ] **Step 6: Run repository gates and commit rollout tooling**

Run: `bun run format:check`

Run: `bun run lint`

Run: `bun run typecheck`

```bash
git add packages/preview-runner/fixtures apps/vm/src/scripts apps/vm/src/services/service.preview_runner.ts packages/preview-runner/src/index.ts
git commit -m "test: verify Next Product Diff adapters"
```

## Rollout Checklist

- [ ] Enable the new adapter only for internal projects first.
- [ ] Record startup success, time to first verified route, target validation failures, capture success, and terminal diagnostic codes.
- [ ] Review at least ten standalone, Turborepo, and Nx preview attempts before enabling the adapter per customer project.
- [ ] Keep the existing runner behind a project feature flag until the new adapter meets the acceptance criteria in the design specification.
- [ ] Begin the Vite + React adapter only after the Next adapter fixture matrix and production trial meet the stated criteria.

## Plan Self-Review

- Spec coverage: Tasks 1 and 7 implement business states, diagnostics, and configuration; Tasks 2–6 implement the adapter boundary, workspace handling, launch, surfaces, validation, and core migration; Task 8 implements fixtures, sandbox deployment, and rollout gates.
- Placeholder scan: no deferred implementation markers or unspecified test steps remain.
- Type consistency: `ProductDiffWorkspacePlan` is created by `NextWorkspaceResolver`, consumed by `NextPreviewLauncher`, `NextPreviewSurface`, and `ProductDiffAdapter`; diagnostics are persisted by `ProductDiffRunner` and returned by the server API.
