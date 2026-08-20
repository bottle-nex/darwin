import "dotenv/config";
import { prisma } from "./client";
import {
    ActivityType,
    ActorType,
    AgentSessionStatus,
    IssueStatus,
    OrgRole,
    ProjectRole,
    TeamRole,
} from "../generated/client";

const ORG_SLUG = process.argv[2] ?? "appx";
const PROJECT_SLUG = process.argv[3] ?? "nocturn";

const ISSUE_COUNT = 84;
const PROJECT_CHAT_COUNT = 46;

let seed = 0x9bc24f;
function random(): number {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
}
function pick<T>(values: readonly T[]): T {
    return values[Math.floor(random() * values.length)];
}
function pickMany<T>(values: readonly T[], count: number): T[] {
    const pool = [...values];
    const taken: T[] = [];
    while (taken.length < count && pool.length) {
        taken.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
    }
    return taken;
}
function chance(probability: number): boolean {
    return random() < probability;
}
function between(min: number, max: number): number {
    return min + Math.floor(random() * (max - min + 1));
}

const NOW = Date.UTC(2026, 7, 20, 12, 0, 0);
const DAY = 86_400_000;
function daysAgo(days: number, jitterMinutes = 0): Date {
    return new Date(NOW - days * DAY + jitterMinutes * 60_000);
}

const PEOPLE = [
    "Aarav Mehta",
    "Priya Nair",
    "Dmitri Volkov",
    "Sofia Marchetti",
    "Kenji Watanabe",
    "Zoe Adebayo",
    "Marcus Lindqvist",
    "Ana Beatriz Souza",
    "Rahul Iyer",
    "Freya Osborne",
    "Tomas Novak",
    "Leila Haddad",
    "Ibrahim Cisse",
    "Hana Kim",
    "Nathan Bourque",
    "Elena Petrova",
    "Diego Ramirez",
    "Ingrid Solberg",
    "Wei Zhang",
    "Amara Okafor",
    "Julian Feldt",
    "Nadia Rahman",
    "Oscar Delgado",
    "Mira Kovacs",
    "Sam Okonkwo",
    "Beatrice Lund",
];

const TEAMS = [
    ["Runners", "runners", "Owns the sandboxed compute that clones and executes target repos."],
    [
        "Agent Core",
        "agent-core",
        "Planning loop, tool routing and the retry policy behind attempts.",
    ],
    ["Ingest", "ingest", "Board intake, issue normalisation and the routing queue."],
    ["Platform", "platform", "Postgres, Redis, migrations and the deploy pipeline."],
    ["Web", "web", "Playground, canvas, editor and everything the browser renders."],
    ["Integrations", "integrations", "GitHub App, PR lifecycle, webhooks and outbound MCP."],
    ["Reliability", "reliability", "Budgets, guardrails, on-call and incident response."],
    [
        "Design Systems",
        "design-systems",
        "Theme tokens, motion language and the shared component set.",
    ],
    ["Security", "security", "Scope grants, secret handling and sandbox escape review."],
] as const;

const TAGS = [
    ["bug", "#ff6467"],
    ["regression", "#ff6467"],
    ["feature", "#9bc24f"],
    ["enhancement", "#9bc24f"],
    ["performance", "#fbbf24"],
    ["flaky", "#fbbf24"],
    ["security", "#f472b6"],
    ["infra", "#60a5fa"],
    ["database", "#60a5fa"],
    ["frontend", "#bcafff"],
    ["backend", "#bcafff"],
    ["agent", "#34d399"],
    ["runner", "#34d399"],
    ["dx", "#94a3b8"],
    ["docs", "#94a3b8"],
    ["good-first-issue", "#94a3b8"],
    ["needs-repro", "#fbbf24"],
    ["blocked", "#ff6467"],
    ["design", "#f472b6"],
    ["telemetry", "#60a5fa"],
] as const;

const COLUMNS = ["Icebox", "Needs Triage", "Waiting on Review", "Someday"] as const;

const AREAS = [
    {
        area: "runner",
        subjects: [
            "sandbox boot",
            "repo clone step",
            "dependency cache",
            "container teardown",
            "runner heartbeat",
            "bun install layer",
            "workspace snapshot",
        ],
        detail: "Runners lease a container, clone the target repo and run the project's own toolchain, so anything that stalls here blocks every downstream attempt.",
        file: "apps/server/src/services/service.runner.ts",
    },
    {
        area: "agent",
        subjects: [
            "planning loop",
            "tool router",
            "retry policy",
            "context window trim",
            "attempt handoff",
            "diff applier",
            "verification pass",
        ],
        detail: "The agent reads the issue, edits the checkout and verifies against the real project before it is allowed to open a PR.",
        file: "apps/server/src/services/service.agent.ts",
    },
    {
        area: "board",
        subjects: [
            "kanban drag",
            "column ordering",
            "filter chips",
            "grouped view",
            "card hover state",
            "custom column rename",
            "issue counter",
        ],
        detail: "The board is the intake surface — every issue an agent picks up is filed here first, so ordering and grouping have to stay stable under concurrent edits.",
        file: "apps/web/components/playground/Home/KanbanDisplay/KanbanDisplay.tsx",
    },
    {
        area: "editor",
        subjects: [
            "slash command menu",
            "table insert",
            "mention autocomplete",
            "paste handler",
            "toggle block",
            "image upload",
            "placeholder text",
        ],
        detail: "Issue descriptions are Tiptap documents stored as HTML, and the agent reads that HTML verbatim as its brief.",
        file: "apps/web/components/playground/Issue/editor/IssueDescriptionEditor.tsx",
    },
    {
        area: "github",
        subjects: [
            "PR open flow",
            "webhook delivery",
            "branch naming",
            "check-run sync",
            "installation token refresh",
            "merge conflict detection",
            "review comment ingest",
        ],
        detail: "The PR is the agent's output, so a dropped webhook leaves an issue reading as in-flight long after the work landed.",
        file: "apps/server/src/services/service.github.ts",
    },
    {
        area: "auth",
        subjects: [
            "OTP cooldown",
            "session refresh",
            "OAuth callback",
            "attempt lockout",
            "invite acceptance",
            "role check",
            "logout propagation",
        ],
        detail: "Auth is passwordless email OTP backed by Redis, with the code hashed at rest and attempts counted per address.",
        file: "apps/server/src/controllers/auth/controller.verify.ts",
    },
    {
        area: "realtime",
        subjects: [
            "socket reconnect",
            "presence list",
            "event fan-out",
            "optimistic echo",
            "room subscription",
            "typing indicator",
            "notification badge",
        ],
        detail: "Every board mutation fans out over sockets, so a missed event leaves one tab showing a state nobody else can see.",
        file: "apps/web/hooks/socket/useSubscribeEventHandlers.ts",
    },
    {
        area: "platform",
        subjects: [
            "migration ordering",
            "connection pool",
            "Redis keyspace events",
            "backup restore",
            "index coverage",
            "query timeout",
            "seed determinism",
        ],
        detail: "Postgres runs behind a pg Pool with the Prisma adapter, and Redis needs keyspace expiry events for the OTP lifecycle to work at all.",
        file: "packages/database/src/client.ts",
    },
] as const;

const SYMPTOMS = [
    "It reproduces on roughly one run in five, which is often enough to be noticed and rare enough that nobody has bisected it.",
    "It only shows up once the project has more than about forty open issues, so it never appears on a fresh workspace.",
    "The failure is silent — nothing is logged, and the request returns 200 with a body that is missing half its rows.",
    "A hard refresh clears it, which is why it has been closed as unreproducible twice already.",
    "It started somewhere in the last two weeks; the deploy window covers about eleven merges.",
    "Two people hit it on the same afternoon, both on Safari, both with a slow connection.",
    "The first attempt always succeeds and every retry after it fails with the same stack.",
];

const WANTED = [
    "Land a failing test first so we can prove the fix rather than assert it.",
    "Fix the root cause rather than adding a guard at the call site — the guard hides the next occurrence.",
    "Keep the public shape unchanged; this should be invisible to anything downstream.",
    "Instrument it before changing behaviour, so we can tell whether the fix actually moved the number.",
    "Ship behind a flag and turn it on for one project before it goes wide.",
    "Write the migration so it can run against a live table without taking a lock.",
];

const MARQUEE = [
    {
        title: "Runner leaks containers when an attempt is aborted mid-clone",
        body: "<p>Aborting an attempt while the repo clone is still streaming leaves the container running. The lease is released, so the scheduler happily hands the slot to the next issue, and within an hour a host is carrying four or five orphans that nothing will ever reap.</p><h2>What we know</h2><ul><li><p>The abort path cancels the clone promise but never awaits the teardown, so the process exits before the runtime finishes stopping the container.</p></li><li><p>Hosts with more than three orphans start failing new boots with <code>no space left on device</code>.</p></li><li><p>Restarting the supervisor clears them, which is why this looked like a disk issue for two weeks.</p></li></ul><h2>Wanted</h2><p>Teardown should be owned by the lease, not the attempt. When a lease is released for any reason the container goes with it, and abort just releases the lease.</p><blockquote><p>Worth checking whether the same gap exists on the timeout path — it takes a different branch out of the same function.</p></blockquote>",
    },
    {
        title: "Agent opens a PR before the verification pass has finished",
        body: "<p>On fast repos the verification pass and the PR open race, and the PR wins. Reviewers get a pull request that claims tests passed while the test run is still going, and about one in twelve of those runs then fails.</p><h2>Reproduction</h2><ul><li><p>Pick any issue whose project has a test command under ten seconds.</p></li><li><p>Watch the activity feed — <code>PrOpened</code> lands before <code>TestResult</code>.</p></li></ul><h2>Wanted</h2><p>The PR open should be a continuation of the verification result rather than a parallel branch. If verification fails, no PR should exist at all, and the attempt should be recorded as failed with the output attached.</p>",
    },
    {
        title: "Board loses column order when two people drag at the same time",
        body: "<p>Two people reordering columns in the same project within a second of each other end up with different orders, and neither matches what the server stored. Whoever refreshes last wins.</p><h2>Cause</h2><p>Each drag writes the full ordering array rather than the moved column's new position, so the second write is computed against a stale snapshot and clobbers the first.</p><h2>Wanted</h2><p>Persist a position per column rather than an array for the project, and let the server resolve collisions. The optimistic update stays, but it should reconcile against what comes back instead of assuming it won.</p>",
    },
    {
        title: "OTP lockout counter never resets after a successful sign-in",
        body: "<p>The attempts key is incremented on every verify but only cleared when the lock expires. Sign in successfully on your fourth try and the counter stays at four, so your next sign-in locks after a single mistake.</p><h2>Wanted</h2><ul><li><p>Clear <code>otp:&lt;email&gt;:attempts</code> on the success path, in the same call that consumes the code.</p></li><li><p>Add a test that signs in on attempt three, then signs in again and confirms a fresh allowance.</p></li></ul><p>The key naming lives in <code>OtpService</code> — go through it rather than touching Redis directly.</p>",
    },
    {
        title: "Description editor drops the table when the document is saved from a collapsed toggle",
        body: "<p>Put a table inside a toggle, collapse the toggle, save. The table comes back empty — the structure survives, the cell contents do not.</p><h2>What we know</h2><p>The collapsed toggle renders its body to a detached node, and the serializer walks the live DOM rather than the ProseMirror document. Anything not currently mounted serialises as an empty node.</p><h2>Wanted</h2><p>Serialise from the editor state, never from the DOM. That also fixes the same class of bug for collapsed sections generally, which is worth a look while the file is open.</p>",
    },
    {
        title: "Add per-project spend ceiling with a hard stop",
        body: "<p>Today a project can burn an unbounded amount on retries. One issue with a flaky test suite went through nineteen attempts overnight before anyone noticed.</p><h2>Wanted</h2><ul><li><p>A configurable ceiling per project, defaulting to something conservative.</p></li><li><p>A warning activity at 80% and a hard stop at 100% — the hard stop aborts in-flight attempts rather than letting them finish.</p></li><li><p>The ceiling and current spend both surface on the project settings page.</p></li></ul><p>Both <code>BudgetThresholdCrossed</code> and <code>BudgetExceeded</code> already exist as activity types, so the feed side is mostly wiring.</p>",
    },
    {
        title: "Socket reconnect replays events the client already applied",
        body: "<p>After a reconnect the server replays from the last acknowledged sequence, but the client acknowledges on receipt rather than on apply. Anything in flight when the socket dropped gets applied twice.</p><p>For status changes this is invisible. For counters and for the notification badge it is not — the badge drifts upward and only a reload fixes it.</p><h2>Wanted</h2><p>Acknowledge after apply, and make the apply step idempotent by event id so a duplicate is a no-op rather than a second mutation.</p>",
    },
    {
        title: "Issue search misses anything with a hyphen in the title",
        body: "<p>Searching for <code>pre-push</code> returns nothing, though searching <code>push</code> finds the issue. The tokeniser splits on hyphen and then requires every token to match as a prefix, so the leading fragment never lines up.</p><h2>Wanted</h2><p>Match the whole phrase as well as the tokens, and rank exact substring hits above token hits. A trigram index would cover this without a rewrite.</p>",
    },
    {
        title: "Agent handoff loses the accumulated context when a worker dies",
        body: "<p>When a worker dies mid-attempt the issue is requeued, but the next worker starts from the original issue text with none of what the first one learned. In practice it repeats the same three dead ends before finding the same wall.</p><h2>Wanted</h2><ul><li><p>Persist a running context blob per attempt, not per worker.</p></li><li><p>On handoff, pass the blob forward and record a <code>WorkerHandoff</code> activity that links both attempts.</p></li></ul><p>The trace URL on <code>AgentSession</code> is the obvious place to hang this off.</p>",
    },
    {
        title: "Kanban card avatars flash the wrong colour on first paint",
        body: "<p>Avatar tone is derived from the user id, but the first render happens before the member list resolves, so every card paints with the fallback tone and then swaps. On a busy board that is forty simultaneous colour changes about 200ms in.</p><h2>Wanted</h2><p>Derive the tone from the id that is already on the card rather than waiting on the member lookup. The lookup is only needed for the name, which can arrive late without anything flashing.</p>",
    },
    {
        title: "Migration 0043 locks the issues table for the length of the backfill",
        body: "<p>The migration adds a non-null column with a default and backfills in the same statement, which takes an <code>ACCESS EXCLUSIVE</code> lock for the whole backfill. On the largest project that was just under four minutes of downtime.</p><h2>Wanted</h2><ul><li><p>Split it: add the column nullable, backfill in batches, then set not-null with a validated constraint.</p></li><li><p>Write down the pattern somewhere — this is the third time we have hit it.</p></li></ul>",
    },
    {
        title: "GitHub check-run status never clears when a PR is force-pushed",
        body: "<p>Force-pushing to an agent branch leaves the previous check runs attached to the PR. The UI shows a red X from a commit that is no longer in the history, and the merge button stays blocked.</p><h2>Wanted</h2><p>On <code>push</code> with a changed head sha, mark superseded check runs as neutral before creating new ones. The webhook already carries both shas.</p>",
    },
];

type Person = { id: string; name: string; image: string | null };

function slugify(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, ".")
        .replace(/^\.|\.$/g, "");
}

function paragraph(text: string): string {
    return `<p>${text}</p>`;
}

function generatedBody(subject: string, area: (typeof AREAS)[number]): string {
    const parts = [
        paragraph(
            `The ${subject} behaves differently under load than it does in isolation, and the difference is large enough that people have started routing around it.`,
        ),
        paragraph(area.detail),
        paragraph(pick(SYMPTOMS)),
        "<h2>Wanted</h2>",
        `<ul><li><p>${pick(WANTED)}</p></li><li><p>Start in <code>${area.file}</code> — that is where the behaviour is decided.</p></li></ul>`,
    ];
    if (chance(0.4)) {
        parts.push(
            `<blockquote><p>Related work touched the same path last month, so check the history before reaching for a rewrite.</p></blockquote>`,
        );
    }
    return parts.join("");
}

const TITLE_SHAPES = [
    (subject: string) => `${subject} silently drops updates under concurrent edits`,
    (subject: string) => `Harden ${subject} against partial failures`,
    (subject: string) => `${subject} times out on projects with large histories`,
    (subject: string) => `Rework ${subject} so retries are idempotent`,
    (subject: string) => `${subject} reports success when nothing was written`,
    (subject: string) => `Surface ${subject} state in the activity feed`,
    (subject: string) => `${subject} regressed after the last theme migration`,
    (subject: string) => `Add telemetry around ${subject}`,
    (subject: string) => `${subject} leaks memory across long sessions`,
    (subject: string) => `Make ${subject} recover cleanly from a dropped connection`,
];

const CHAT_LINES = [
    "Reproduced on my machine — same stack, same line.",
    "I looked at this last sprint and convinced myself it was upstream. It is not.",
    "Can we get a failing test before anyone touches the fix? Otherwise we will be back here.",
    "The trace is attached to the second attempt if anyone wants to read it.",
    "This is going to conflict with the branch I have open. Give me until tomorrow.",
    "Bumping priority — two customers hit this today.",
    "Not convinced this is the same bug as the one it was closed as a duplicate of.",
    "Agreed on the approach. One note: the guard needs to run before the lease is released, not after.",
    "I can take this if nobody has started.",
    "The fix is small but the test setup is not. Budget half a day.",
    "Confirmed fixed on the branch. Merging once checks are green.",
    "This has been open long enough that the surrounding code moved. Worth re-reading before starting.",
    "Do we know when this started? A bisect would save a lot of guessing here.",
    "Left a couple of notes on the PR — nothing blocking.",
    "I would rather do this properly now than patch it twice.",
    "Same root cause as the runner one, I think. Different symptom.",
    "Rolled back for now. Reopening.",
    "The numbers moved after the deploy, so whatever we did worked.",
];

const REPLY_LINES = [
    "Good catch — updating the description.",
    "That matches what I saw.",
    "Taking it.",
    "Not quite: the second path skips that branch entirely.",
    "Done, pushed.",
    "Makes sense to me.",
    "I will pull the trace and check.",
    "Let us do that.",
];

const PROJECT_CHAT_LINES = [
    "Deploy is out. Watching the error rate for the next hour.",
    "Standup moved to 10:15 tomorrow.",
    "Whoever owns the runner queue — it is backed up about nine minutes.",
    "Merged the theme token split. Nothing should look different; shout if it does.",
    "Reminder that the pre-push hook runs format, lint and typecheck in that order.",
    "Postgres is on 16 locally now. Recreate your container if it still says 15.",
    "We are down to eleven open bugs, which is the lowest it has been.",
    "Nice work on the migration split, that was overdue.",
    "Anyone else seeing slow clones this morning?",
    "The staging runner pool is at capacity, so attempts will queue.",
    "Draft plan for next cycle is in the docs — comments welcome until Friday.",
    "Rolled back the socket change. Will retry with the idempotency work.",
    "Two new members joined this week, say hi.",
    "Cost per attempt is down about eighteen percent since the retry change.",
    "Please stop force-pushing to shared branches.",
    "Incident closed. Writeup by end of day.",
];

const EMOJIS = ["👍", "🎉", "👀", "🚀", "🔥", "😅", "✅", "🙏"];

const STATUS_FLOW: Record<string, IssueStatus[]> = {
    [IssueStatus.Todo]: [],
    [IssueStatus.Queued]: [IssueStatus.Queued],
    [IssueStatus.InProgress]: [IssueStatus.Queued, IssueStatus.InProgress],
    [IssueStatus.InReview]: [IssueStatus.Queued, IssueStatus.InProgress, IssueStatus.InReview],
    [IssueStatus.Done]: [
        IssueStatus.Queued,
        IssueStatus.InProgress,
        IssueStatus.InReview,
        IssueStatus.Done,
    ],
    [IssueStatus.Failed]: [IssueStatus.Queued, IssueStatus.InProgress, IssueStatus.Failed],
    [IssueStatus.Cancelled]: [IssueStatus.Cancelled],
    [IssueStatus.Parked]: [],
};

const AGENT_WORKED_STATUSES: IssueStatus[] = [
    IssueStatus.InProgress,
    IssueStatus.InReview,
    IssueStatus.Done,
    IssueStatus.Failed,
];

const STATUS_WEIGHTS: IssueStatus[] = [
    ...Array(16).fill(IssueStatus.Todo),
    ...Array(6).fill(IssueStatus.Queued),
    ...Array(10).fill(IssueStatus.InProgress),
    ...Array(9).fill(IssueStatus.InReview),
    ...Array(22).fill(IssueStatus.Done),
    ...Array(4).fill(IssueStatus.Failed),
    ...Array(3).fill(IssueStatus.Cancelled),
    ...Array(5).fill(IssueStatus.Parked),
];

async function main() {
    const project = await prisma.project.findFirst({
        where: { slug: PROJECT_SLUG, organization: { slug: ORG_SLUG } },
        include: { organization: true },
    });
    if (!project) throw new Error(`No project ${ORG_SLUG}/${PROJECT_SLUG}`);

    const orgId = project.organization.id;
    const projectId = project.id;

    const users: Person[] = [];
    for (const name of PEOPLE) {
        const email = `${slugify(name)}@nocturn.dev`;
        const user = await prisma.user.upsert({
            where: { email },
            update: { name },
            create: { name, email, emailVerified: daysAgo(between(40, 300)), setupComplete: true },
            select: { id: true, name: true, image: true },
        });
        users.push({ id: user.id, name: user.name ?? name, image: user.image });
    }

    const existingMembers = await prisma.projectMember.findMany({
        where: { projectId },
        select: { userId: true },
    });
    for (const person of users) {
        await prisma.orgMember.upsert({
            where: { orgId_userId: { orgId, userId: person.id } },
            update: {},
            create: { orgId, userId: person.id, role: pick([OrgRole.Member, OrgRole.Admin]) },
        });
        await prisma.projectMember.upsert({
            where: { projectId_userId: { projectId, userId: person.id } },
            update: {},
            create: {
                projectId,
                userId: person.id,
                role: pick([
                    ProjectRole.Write,
                    ProjectRole.Write,
                    ProjectRole.Maintain,
                    ProjectRole.Triage,
                    ProjectRole.Read,
                    ProjectRole.Admin,
                ]),
            },
        });
    }
    const allMemberIds = [
        ...existingMembers.map((m) => m.userId),
        ...users.map((u) => u.id),
    ].filter((id, index, ids) => ids.indexOf(id) === index);
    const memberRows = await prisma.projectMember.findMany({
        where: { projectId },
        select: { id: true, userId: true },
    });
    const memberIdByUser: Record<string, string> = {};
    for (const row of memberRows) memberIdByUser[row.userId] = row.id;
    const owner = users[0];

    for (const [name, slug, description] of TEAMS) {
        const team = await prisma.team.upsert({
            where: { projectId_slug: { projectId, slug } },
            update: { name, description },
            create: { projectId, name, slug, description },
        });
        for (const person of pickMany(users, between(4, 9))) {
            await prisma.teamMember.upsert({
                where: { teamId_userId: { teamId: team.id, userId: person.id } },
                update: {},
                create: {
                    teamId: team.id,
                    userId: person.id,
                    role: chance(0.25) ? TeamRole.Maintainer : TeamRole.Member,
                },
            });
        }
    }

    const tags = [];
    for (const [name, color] of TAGS) {
        tags.push(
            await prisma.tag.upsert({
                where: { projectId_name: { projectId, name } },
                update: { color },
                create: { projectId, name, color },
            }),
        );
    }

    const existingColumns = await prisma.customColumn.findMany({ where: { projectId } });
    const columns = [...existingColumns];
    for (let index = 0; index < COLUMNS.length; index++) {
        const label = COLUMNS[index];
        if (columns.some((column) => column.label === label)) continue;
        columns.push(
            await prisma.customColumn.create({
                data: { projectId, label, order: existingColumns.length + index + 1 },
            }),
        );
    }

    const highest = await prisma.issue.aggregate({
        where: { projectId },
        _max: { number: true },
    });
    let nextNumber = (highest._max.number ?? 0) + 1;

    const specs = MARQUEE.map((entry) => ({ ...entry, area: pick(AREAS) }));
    while (specs.length < ISSUE_COUNT) {
        const area = pick(AREAS);
        const subject = pick(area.subjects);
        specs.push({
            title: pick(TITLE_SHAPES)(subject),
            body: generatedBody(subject, area),
            area,
        });
    }

    const activityRows: Array<{
        issueId: string;
        type: ActivityType;
        payload: object;
        actorType: ActorType;
        actorUserId: string | null;
        sessionId: string | null;
        createdAt: Date;
    }> = [];
    const chatSeeds: Array<{
        issueId: string;
        senderId: string;
        message: string;
        createdAt: Date;
        replies: Array<{ senderId: string; message: string; createdAt: Date }>;
    }> = [];
    const createdIssues: Array<{ id: string; number: number; title: string }> = [];

    for (const spec of specs) {
        const status = pick(STATUS_WEIGHTS);
        const openedDaysAgo = between(1, 120);
        const createdAt = daysAgo(openedDaysAgo, between(0, 600));
        const creator = pick(users);
        const assignees = pickMany(users, between(0, 3));
        const issueTags = pickMany(tags, between(1, 4));
        const column = status === IssueStatus.Parked ? pick(columns) : null;
        const priority = pick([1, 2, 2, 3, 3, 3, 4]);
        const hasDates = chance(0.55);
        const startDate = hasDates ? daysAgo(openedDaysAgo - between(0, 3)) : null;
        const targetDate = hasDates ? daysAgo(openedDaysAgo - between(6, 40)) : null;
        const resolved = status === IssueStatus.Done;

        const issue = await prisma.issue.create({
            data: {
                projectId,
                number: nextNumber++,
                createdById: creator.id,
                title: spec.title,
                description: spec.body,
                status,
                priority,
                startDate,
                targetDate,
                customColumnId: column?.id ?? null,
                createdAt,
                resolvedAt: resolved ? daysAgo(Math.max(0, openedDaysAgo - between(1, 12))) : null,
                prUrl:
                    status === IssueStatus.InReview || resolved
                        ? `https://github.com/appx/nocturn/pull/${between(120, 980)}`
                        : null,
                prBranch:
                    status === IssueStatus.InReview || resolved
                        ? `matcha/issue-${nextNumber - 1}`
                        : null,
                assignees: { connect: assignees.map((person) => ({ id: person.id })) },
                tags: { connect: issueTags.map((tag) => ({ id: tag.id })) },
            },
            select: { id: true, number: true, title: true },
        });
        createdIssues.push(issue);

        const actorSnapshot = (person: Person) => ({ name: person.name, image: person.image });
        let cursor = createdAt.getTime();
        const step = () => {
            cursor += between(20, 400) * 60_000;
            return new Date(Math.min(cursor, NOW));
        };
        const humanRow = (
            type: ActivityType,
            payload: object,
            person: Person,
            sessionId: string | null = null,
        ) =>
            activityRows.push({
                issueId: issue.id,
                type,
                payload: { ...payload, actor: actorSnapshot(person) },
                actorType: ActorType.User,
                actorUserId: person.id,
                sessionId,
                createdAt: step(),
            });
        const agentRow = (type: ActivityType, payload: object, sessionId: string | null) =>
            activityRows.push({
                issueId: issue.id,
                type,
                payload: { ...payload, actor: { name: "matcha", image: null } },
                actorType: ActorType.Agent,
                actorUserId: null,
                sessionId,
                createdAt: step(),
            });

        activityRows.push({
            issueId: issue.id,
            type: ActivityType.IssueCreated,
            payload: { actor: actorSnapshot(creator) },
            actorType: ActorType.User,
            actorUserId: creator.id,
            sessionId: null,
            createdAt,
        });

        for (const tag of issueTags) {
            humanRow(
                ActivityType.LabelAdded,
                { label: { id: tag.id, name: tag.name, color: tag.color } },
                creator,
            );
        }
        for (const person of assignees) {
            humanRow(
                ActivityType.AssigneeAdded,
                { user: { id: person.id, name: person.name, image: person.image } },
                pick(users),
            );
        }
        if (hasDates) {
            humanRow(
                ActivityType.DatesChanged,
                {
                    from: { startDate: null, targetDate: null },
                    to: {
                        startDate: startDate?.toISOString() ?? null,
                        targetDate: targetDate?.toISOString() ?? null,
                    },
                },
                pick(users),
            );
        }
        if (chance(0.4)) {
            humanRow(ActivityType.PriorityChanged, { from: 3, to: priority }, pick(users));
        }
        if (chance(0.25)) {
            humanRow(ActivityType.DescriptionChanged, {}, creator);
        }

        const flow = STATUS_FLOW[status] ?? [];
        let previous: IssueStatus = IssueStatus.Todo;
        for (const next of flow) {
            humanRow(
                ActivityType.StatusChanged,
                {
                    from: { kind: "status", status: previous },
                    to: { kind: "status", status: next },
                },
                pick(users),
            );
            previous = next;
        }
        if (column) {
            humanRow(
                ActivityType.ColumnChanged,
                {
                    from: { kind: "status", status: IssueStatus.Todo },
                    to: { kind: "column", id: column.id, label: column.label },
                },
                pick(users),
            );
        }

        const agentWorked = AGENT_WORKED_STATUSES.includes(status);
        if (agentWorked) {
            const attempts = status === IssueStatus.Failed ? between(2, 3) : between(1, 2);
            for (let attempt = 1; attempt <= attempts; attempt++) {
                const failed = status === IssueStatus.Failed || attempt < attempts;
                const session = await prisma.agentSession.create({
                    data: {
                        id: `seed-${issue.id}-${attempt}`,
                        issueId: issue.id,
                        attemptNumber: attempt,
                        status: failed ? AgentSessionStatus.Failed : AgentSessionStatus.Succeeded,
                        summary: failed
                            ? "Attempt stopped after the verification pass failed twice on the same assertion."
                            : "Traced the failure to the lease release path, moved teardown behind it and added a regression test.",
                        stats: {
                            numTurns: between(8, 64),
                            durationMs: between(90, 1400) * 1000,
                            commits: failed ? 0 : between(1, 5),
                            filesChanged: failed ? 0 : between(1, 12),
                        },
                        cost: {
                            totalCostUsd: Number((random() * 4 + 0.2).toFixed(2)),
                            sandboxSeconds: between(120, 2400),
                        },
                        error: failed ? "verification_failed" : null,
                        startedAt: step(),
                        endedAt: step(),
                    },
                });
                agentRow(ActivityType.RunStarted, { attemptNumber: attempt }, session.id);
                agentRow(ActivityType.BranchCreated, {}, session.id);
                if (failed) {
                    agentRow(
                        ActivityType.AttemptFailed,
                        {
                            attemptNumber: attempt,
                            reason: pick([
                                "verification pass failed",
                                "build did not complete",
                                "sandbox lost its lease",
                            ]),
                        },
                        session.id,
                    );
                } else {
                    agentRow(ActivityType.CommitsPushed, {}, session.id);
                    agentRow(ActivityType.TestResult, {}, session.id);
                    agentRow(
                        ActivityType.RunCompleted,
                        { attemptNumber: attempt, summary: session.summary ?? undefined },
                        session.id,
                    );
                    if (status === IssueStatus.InReview || resolved) {
                        agentRow(
                            ActivityType.PrOpened,
                            {
                                url: `https://github.com/appx/nocturn/pull/${between(120, 980)}`,
                            },
                            session.id,
                        );
                    }
                }
            }
        }
        if (resolved) {
            humanRow(ActivityType.PrMerged, {}, pick(users));
            humanRow(ActivityType.IssueResolved, {}, pick(users));
        }
        if (status === IssueStatus.Cancelled) {
            humanRow(ActivityType.IssueCancelled, {}, pick(users));
        }

        const commentCount = between(0, 5);
        for (let index = 0; index < commentCount; index++) {
            const sender = pick(users);
            const at = step();
            chatSeeds.push({
                issueId: issue.id,
                senderId: sender.id,
                message: pick(CHAT_LINES),
                createdAt: at,
                replies: Array.from({ length: chance(0.45) ? between(1, 3) : 0 }, () => ({
                    senderId: pick(users).id,
                    message: pick(REPLY_LINES),
                    createdAt: new Date(at.getTime() + between(5, 900) * 60_000),
                })),
            });
        }
    }

    activityRows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    await prisma.issueActivity.createMany({ data: activityRows });

    for (const seedChat of chatSeeds) {
        const withMention =
            chance(0.22) && memberRows.length
                ? `${seedChat.message} @[member:${memberIdByUser[pick(users).id]}]`
                : chance(0.15) && createdIssues.length
                  ? `${seedChat.message} #[issue:${pick(createdIssues).id}]`
                  : seedChat.message;
        const root = await prisma.chat.create({
            data: {
                issueId: seedChat.issueId,
                senderId: seedChat.senderId,
                message: withMention,
                createdAt: seedChat.createdAt,
            },
            select: { id: true },
        });
        for (const reply of seedChat.replies) {
            await prisma.chat.create({
                data: {
                    issueId: seedChat.issueId,
                    senderId: reply.senderId,
                    message: reply.message,
                    repliedToId: root.id,
                    createdAt: reply.createdAt,
                },
            });
        }
        for (const reactor of pickMany(users, chance(0.5) ? between(1, 4) : 0)) {
            await prisma.chatReaction.upsert({
                where: { chatId_userId: { chatId: root.id, userId: reactor.id } },
                update: {},
                create: { chatId: root.id, userId: reactor.id, emoji: pick(EMOJIS) },
            });
        }
    }

    for (let index = 0; index < PROJECT_CHAT_COUNT; index++) {
        const sender = pick(users);
        const at = daysAgo(between(0, 45), between(0, 900));
        const root = await prisma.projectChat.create({
            data: {
                projectId,
                senderId: sender.id,
                message: pick(PROJECT_CHAT_LINES),
                createdAt: at,
            },
            select: { id: true },
        });
        for (let reply = 0; reply < (chance(0.4) ? between(1, 3) : 0); reply++) {
            await prisma.projectChat.create({
                data: {
                    projectId,
                    senderId: pick(users).id,
                    message: pick(REPLY_LINES),
                    repliedToId: root.id,
                    createdAt: new Date(at.getTime() + between(3, 600) * 60_000),
                },
            });
        }
        for (const reactor of pickMany(users, chance(0.45) ? between(1, 3) : 0)) {
            await prisma.projectChatReaction.upsert({
                where: { projectChatId_userId: { projectChatId: root.id, userId: reactor.id } },
                update: {},
                create: { projectChatId: root.id, userId: reactor.id, emoji: pick(EMOJIS) },
            });
        }
    }

    console.log(
        JSON.stringify(
            {
                project: `${ORG_SLUG}/${PROJECT_SLUG}`,
                owner: owner.name,
                members: allMemberIds.length,
                teams: TEAMS.length,
                tags: tags.length,
                columns: columns.length,
                issues: createdIssues.length,
                activities: activityRows.length,
                issueComments: chatSeeds.length,
                projectChats: PROJECT_CHAT_COUNT,
            },
            null,
            2,
        ),
    );
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
