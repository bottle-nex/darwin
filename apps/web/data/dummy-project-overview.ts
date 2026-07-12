import type { ProjectOverview } from "@/types/overview";

const BRIEF_MARKDOWN = `# Payments Service

Checkout, billing, and webhook fan-out for Acme. Bun + Express 5, Postgres via
Prisma. Everything ships from \`main\`; there are no long-lived branches.

## Layout

- \`src/routers/\` — versioned routers. Wire URLs only, no business logic.
- \`src/controllers/\` — one file per action, default-exports a class with a
  static handler. Validate input with Zod, then call a service.
- \`src/services/\` — stateless helpers, one class per file.
- \`prisma/\` — schema and migrations. Migrations are append-only.

## Rules that matter

Every response goes through \`ResponseWriter\`. Never call \`res.json\` or
\`res.status\` from a controller — the envelope shape is load-bearing for the
web client.

Money is stored in minor units as an integer. There are no floats anywhere in
this codebase, and a PR that introduces one will be rejected.

Webhooks from Stripe are verified in \`service.webhook.ts\` before anything else
touches them. Do not move that check.

## Verifying a change

\`\`\`bash
bun run typecheck
bun run test
bun run test:integration   # needs docker-compose up -d
\`\`\`

A change to routing or the money path is not done until the integration suite
passes. Attach the run to the PR description.`;

export const dummyProjectOverview: ProjectOverview = {
    key: "PAY",
    repo: "acme-labs/payments-service",
    name: "Payments Service",
    purpose: "Checkout, billing, and webhook fan-out for every Acme surface.",
    description:
        "The service every other product at Acme bills through. It owns the checkout session, the subscription lifecycle, and the webhook fan-out that tells the rest of the estate a payment landed. Agents pick issues off this board and open PRs straight against the repo, so the brief below is the context they get before they touch anything.",
    brief: {
        markdown: BRIEF_MARKDOWN,
        updatedAt: "2026-06-28T09:12:00.000Z",
    },
    links: [
        {
            id: "lnk_1",
            kind: "github",
            label: "Repository",
            url: "https://github.com/acme-labs/payments-service",
        },
        {
            id: "lnk_2",
            kind: "figma",
            label: "Checkout redesign",
            url: "https://figma.com/file/acme/checkout-redesign",
        },
        {
            id: "lnk_3",
            kind: "live",
            label: "Production",
            url: "https://pay.acme.com",
        },
        {
            id: "lnk_4",
            kind: "staging",
            label: "Staging",
            url: "https://pay.staging.acme.dev",
        },
        {
            id: "lnk_5",
            kind: "docs",
            label: "API reference",
            url: "https://docs.acme.com/payments",
        },
        {
            id: "lnk_6",
            kind: "notion",
            label: "On-call runbook",
            url: "https://notion.so/acme/payments-runbook",
        },
    ],
    leadId: "usr_1",
    team: [
        {
            id: "usr_1",
            name: "Maya Chen",
            email: "maya@acme.com",
            image: null,
            role: "Admin",
        },
        {
            id: "usr_2",
            name: "Rishi Kant",
            email: "rishi@acme.com",
            image: null,
            role: "Maintain",
        },
        {
            id: "usr_3",
            name: "Ava Silva",
            email: "ava@acme.com",
            image: null,
            role: "Write",
        },
        {
            id: "usr_4",
            name: "Sam Okafor",
            email: "sam@acme.com",
            image: null,
            role: "Write",
        },
        {
            id: "usr_5",
            name: "Leo Marchetti",
            email: "leo@acme.com",
            image: null,
            role: "Triage",
        },
    ],
    status: "active",
    createdAt: "2025-11-04T10:00:00.000Z",
    updatedAt: "2026-07-09T16:41:00.000Z",
};
