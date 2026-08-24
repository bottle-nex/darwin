# Next.js Product Diff Adapter Design

## Goal

Make Product Diff reliable for Next.js applications in standalone repositories, Turborepos, and Nx workspaces. The system must produce trustworthy visual comparisons when a project can be previewed, explain exactly why it cannot when it cannot, and provide a stable boundary for future framework adapters.

## Scope

This design supports Next.js App Router and Pages Router applications. It covers standalone repositories, npm, pnpm, Yarn, and Bun workspaces, Turborepo, and Nx.

Vite, static HTML, Astro, Remix, and other frameworks are intentionally outside this implementation. The adapter contract must let them be added later without changing the Product Diff core.

## Product Contract

Product Diff has one framework-neutral responsibility: compare verified base and head previews, then publish the result.

An adapter has one framework-specific responsibility: identify an application, prepare it, start it, verify it, expose a visual surface, and clean up generated state.

The Product Diff core must not create framework route files, invoke `next dev`, infer a monorepo command, or decide how a framework starts.

The product reports one of these outcomes:

| Outcome | Meaning |
| --- | --- |
| Ready | Base and head previews were verified, captured, compared, and published. |
| Unsupported | No installed adapter supports the repository. |
| ConfigurationRequired | A supported application exists, but Matcha cannot confidently select or start it without project configuration. |
| PreviewUnavailable | The selected application could not start or render with its current dependencies and safe preview configuration. |
| Failed | Matcha infrastructure or an unexpected internal error failed. |
| Stale | The pull request changed while Product Diff was running. |

Every non-ready outcome retains redacted diagnostics: the selected application, workspace type, command category, health route, and first relevant failure.

## Architecture

```text
Product Diff core
  checkout -> select adapter -> prepare -> start -> verify -> capture -> compare -> publish
                                      |
                                      v
                            Next.js Product Diff adapter
                              workspace resolution
                              application selection
                              launch planning
                              preview surface lifecycle
                              diagnostics
```

The core receives a running preview URL and a verified visual surface from an adapter. It uses the same browser capture, pairing, artifact upload, stale-PR check, and result publication flow for every adapter.

The Next.js adapter owns App Router and Pages Router rules. It exposes exactly one router strategy in a run. It never creates App Router and Pages Router files for the same preview URL at the same time.

## Code Organization

The existing `apps/vm/src/services/service.product_diff.ts` becomes a thin runner. New code lives under a focused Product Diff namespace:

```text
apps/vm/src/services/product_diff/
  ProductDiffAdapter.ts
  ProductDiffAdapterRegistry.ts
  ProductDiffWorkspaceResolver.ts
  ProductDiffPreviewLifecycle.ts
  ProductDiffRunDiagnostics.ts
  adapters/next/
    NextProductDiffAdapter.ts
    NextWorkspaceResolver.ts
    NextPreviewLauncher.ts
    NextPreviewSurface.ts
    NextPreviewDiagnostics.ts

packages/preview-runner/src/
  core/
  adapters/next/
```

`apps/vm` owns sandbox lifecycle, database state, logging, and orchestration. `packages/preview-runner` remains the sandbox-bundled command and owns filesystem-local work, browser validation, and temporary route generation.

Every file has one responsibility. Names describe the domain and action directly. Catch-all files such as `utils.ts`, `helpers.ts`, and `manager.ts` are not used. New code follows the repository convention of no comments; types, directories, classes, and methods explain the flow.

## Workspace Resolution

The Next.js adapter resolves a preview plan in this order:

1. Read repository workspace markers and root package manager configuration.
2. Enumerate Next.js application packages without a shallow directory-depth limit.
3. Map changed files to applications using direct ownership and workspace dependency metadata.
4. Select one application only when the evidence is unambiguous.
5. Return ConfigurationRequired when a shared-package or multi-app change cannot be confidently attributed.
6. Apply explicit project configuration before automatic inference when it exists.

A preview plan contains the repository root, selected application directory, package manager, installation directory, supported launch command, health route, router type, and environment placeholder policy.

Turborepo and Nx are workspace-resolution modes, not framework adapters. A Next.js app inside either is handled by the Next.js adapter after the resolver supplies the correct workspace plan.

## Launch Strategy

The adapter installs dependencies from the resolved workspace root. It uses a controlled, declared project launch strategy rather than always executing `next dev` directly.

The launch planner supports a known command form for standalone Next, workspace package scripts, Turborepo task invocation, and Nx target invocation. It injects an unused local port and safe environment values. If a project needs a nonstandard command, the product asks the owner for preview configuration rather than guessing.

The adapter starts the actual application before creating an isolated visual surface. It verifies a configured or discovered health route in a browser. A root-layout dependency failure is reported as PreviewUnavailable with the first useful compile error.

## Visual Surface Strategy

The preferred surface is an actual application route that represents the changed visual area. This produces the most trustworthy comparison.

The harness agent is used only when an actual route cannot adequately isolate the affected visual component. It runs only after application startup has been verified.

Generated routes are job-scoped and collision-free. The adapter records every generated file before writing it. Cleanup runs after success, failure, retry, and cancellation.

An App Router application uses an App Router surface. A Pages Router application uses a Pages Router surface. There is no cross-router escape fallback in the first release.

The system does not claim to automatically bypass all root layouts or global providers. If the actual application cannot start due to missing dependencies or required configuration, it returns a precise diagnostic and offers project-level preview configuration.

## Harness Integrity

The harness agent assists with visual target selection, not application bootstrapping.

Before capture, the runner verifies that each manifest source path exists, each target file exists, the target imports its claimed source or a declared wrapper, and every target state renders in a browser without redirects, Next error overlays, page errors, console errors, missing roots, or empty roots.

The capture pipeline only proceeds after this verification. A manifest warning cannot block a valid Product Diff run because warnings are advisory. Warnings are normalized and surfaced as truncated, never silently discarded without an indication.

## Observability and Configuration

Each run records a redacted attempt timeline with workspace resolution, selected application, adapter identifier, launch strategy category, temporary route path, health checks, browser validation results, and first meaningful failure.

Project owners can supply overrides for application path, preview command, health route, visual routes, and safe preview environment values. Overrides are versioned, validated, visible in the project UI, and exercised by a manual preview verification action.

## Test Matrix

Maintained fixture repositories cover:

- standalone Next.js App Router;
- standalone Next.js Pages Router;
- pnpm Turborepo with a shared UI package;
- Nx workspace with a Next.js application;
- multiple Next.js applications with an ambiguous shared-package change;
- a custom declared development command;
- App Router provider-tree compilation failure;
- an existing customer route at the generated-preview path;
- base and head revisions where an application moves or is added;
- malformed harness metadata, missing target files, and long warnings.

Each fixture asserts both success behavior and the exact outcome code and diagnostic category on failure.

## Migration and Rollout

1. Preserve the current runner behind a feature flag while the Next adapter runs in shadow mode.
2. Compare startup success, time to first preview, capture success, and failure classifications on internal and opted-in projects.
3. Enable the adapter per project after fixture and shadow-mode acceptance criteria are met.
4. Make it the default for Next.js projects.
5. Start a Vite/React adapter only after the Next adapter is reliable across standalone, Turborepo, and Nx projects.

Rollback disables the adapter flag and preserves artifacts and diagnostics already collected. No adapter change may alter existing published Product Diff artifacts.

## Acceptance Criteria

- A known-good standalone Next.js app reaches Ready.
- A known-good Turborepo Next.js app reaches Ready using the workspace root and selected app task.
- A known-good Nx Next.js app reaches Ready using its configured target.
- A root-layout compile failure reaches PreviewUnavailable with a useful redacted error.
- An ambiguous multi-app change reaches ConfigurationRequired without selecting an arbitrary app.
- App Router and Pages Router preview surfaces never coexist at the same route.
- The browser verifier rejects an invalid target before screenshot capture.
- Every generated path is cleaned after each terminal outcome.
- The existing Product Diff UI renders all new outcome states and diagnostics clearly.
