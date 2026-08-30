import "./load-env";

import {
    NOTIFICATION_SCOPE,
    NotificationScope,
} from "@trymatcha/types/notifications/notification-scope";

import type { CustomColumn } from "../generated/client";
import {
    ActivitySurface,
    ActivityType,
    ActorType,
    AgentSessionStatus,
    InvitationStatus,
    IssueStatus,
    KanbanOptionView,
    NotificationType,
    OrgRole,
    PlanStatus,
    PostKind,
    PostStatus,
    ProductDiffStatus,
    ProjectRole,
    ReleaseChannel,
    SetupQuestionStatus,
    SetupQuestionType,
    SetupStatus,
    TeamRole,
    WorkerStatus,
} from "../generated/client";
import { prisma } from "./client";

const ORG = {
    slug: "appx",
    name: "Appx",
    description: "Ships Nocturn, a scheduling product that runs on matcha for its own bug queue.",
};

const PROJECT = {
    slug: "nocturn",
    name: "Nocturn",
    summary: "Scheduling product — the repo matcha's runners clone, build and open PRs against.",
    description:
        "Nocturn is the target project. Issues filed on this board get picked up by an agent, run inside a sandboxed runner against this repo, and come back as a pull request.",
    icon: { kind: "icon", name: "moon", color: "#9bc24f" } as const,
    repoFullName: "appx/nocturn",
    repoUrl: "https://github.com/appx/nocturn",
    defaultBranch: "main",
    repoId: 812449301,
};

const SEED_EMAIL_DOMAIN = "nocturn.dev";
const ISSUE_COUNT = 96;
const ISSUES_PER_BOARD_LANE = 60;
const PROJECT_CHAT_COUNT = 52;
const NOTIFICATIONS_PER_USER = 44;

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

const NOW = Date.now();
const DAY = 86_400_000;
function daysAgo(days: number, jitterMinutes = 0): Date {
    return new Date(NOW - days * DAY + jitterMinutes * 60_000);
}
function minutesAgo(minutes: number): Date {
    return new Date(NOW - minutes * 60_000);
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

const SPACE = { name: "Backlog", slug: "backlog" } as const;
const COLUMNS = ["Icebox", "Needs Triage", "Waiting on Review", "Someday"] as const;

const SPECIALIZATIONS = ["frontend", "backend", "infra", "agent"] as const;

const TEMPLATES = [
    {
        name: "Bug report",
        icon: { kind: "emoji", char: "🐛" },
        isDefault: true,
        description:
            "<h2>What happened</h2><p></p><h2>Expected</h2><p></p><h2>Steps to reproduce</h2><ol><li><p></p></li></ol><h2>Environment</h2><p>Browser, OS, project size.</p>",
    },
    {
        name: "Feature request",
        icon: { kind: "emoji", char: "✨" },
        isDefault: false,
        description:
            "<h2>Problem</h2><p></p><h2>Proposal</h2><p></p><h2>Out of scope</h2><ul><li><p></p></li></ul>",
    },
    {
        name: "Agent task",
        icon: { kind: "emoji", char: "🤖" },
        isDefault: false,
        description:
            "<h2>Brief</h2><p>Written for the agent — say what to change, not how you would change it.</p><h2>Acceptance</h2><ul><li><p>A failing test exists before the fix.</p></li><li><p>The suite is green on the branch.</p></li></ul><h2>Files worth reading first</h2><p><code></code></p>",
    },
    {
        name: "Incident follow-up",
        icon: { kind: "emoji", char: "🚨" },
        isDefault: false,
        description:
            "<h2>Incident</h2><p></p><h2>Contributing cause</h2><p></p><h2>Action</h2><ul><li><p></p></li></ul>",
    },
    {
        name: "Performance regression",
        icon: { kind: "emoji", char: "📉" },
        isDefault: false,
        description:
            "<h2>Numbers</h2><p>Before, after, and how they were measured.</p><h2>Suspected window</h2><p></p><h2>Wanted</h2><p>Instrument first, then change behaviour.</p>",
    },
    {
        name: "Migration",
        icon: { kind: "emoji", char: "🗃️" },
        isDefault: false,
        description:
            "<h2>Schema change</h2><p></p><h2>Backfill</h2><p>Must run against a live table without taking a lock.</p><h2>Rollback</h2><p></p>",
    },
] as const;

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

type Person = { id: string; name: string; image: string | null; email: string };

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

const STATUS_PLAN: Array<[IssueStatus, number]> = [
    [IssueStatus.Todo, 18],
    [IssueStatus.Queued, 9],
    [IssueStatus.InProgress, 11],
    [IssueStatus.InReview, 10],
    [IssueStatus.Done, 24],
    [IssueStatus.Failed, 7],
    [IssueStatus.Cancelled, 5],
    [IssueStatus.Parked, 12],
];

const STATUS_FLOW: Record<IssueStatus, IssueStatus[]> = {
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

const POSTS = [
    {
        kind: PostKind.Blog,
        slug: "why-the-agent-runs-your-code",
        title: "Why the agent runs your code before it opens a PR",
        summary:
            "A patch that compiles in the model's head is a guess. We made the runner the referee.",
        tags: ["engineering", "runners"],
        status: PostStatus.Published,
        publishedDaysAgo: 4,
        content:
            "<p>The first version of matcha wrote patches straight from the issue text. It was fast, it read well, and roughly half of what it produced did not build.</p><h2>The referee</h2><p>Now every attempt gets a sandboxed container that clones the target repo and runs the project's own toolchain. If the suite is red, there is no pull request — the attempt is recorded as failed with the output attached, and the next attempt starts from what the last one learned.</p><p>It is slower per attempt and dramatically cheaper per merged fix.</p>",
    },
    {
        kind: PostKind.Blog,
        slug: "the-board-is-the-api",
        title: "The board is the API",
        summary: "Filing an issue is the only integration surface we ask a team to learn.",
        tags: ["product", "design"],
        status: PostStatus.Published,
        publishedDaysAgo: 12,
        content:
            "<p>Every autonomous coding tool eventually invents a control plane. Ours is a Kanban board, because that is the one your team already keeps open.</p><h2>What that buys</h2><ul><li><p>Priority is a column position, not a config file.</p></li><li><p>Ownership is an assignee, not a routing rule.</p></li><li><p>Cancelling work is a drag, not an API call.</p></li></ul>",
    },
    {
        kind: PostKind.Blog,
        slug: "reading-an-activity-feed",
        title: "How to read an agent's activity feed",
        summary: "Every attempt leaves a trail. Here is what each row actually means.",
        tags: ["engineering", "observability"],
        status: PostStatus.Published,
        publishedDaysAgo: 21,
        content:
            "<p>An attempt produces between eight and sixty rows of activity. Most of it is noise until you know which rows carry the decisions.</p><h2>The rows that matter</h2><p><code>RunStarted</code> tells you which worker took the issue. <code>BugReproduced</code> is the single strongest predictor of a merged PR. <code>AttemptFailed</code> carries the reason, and it is almost always one of three.</p>",
    },
    {
        kind: PostKind.Blog,
        slug: "budgets-before-autonomy",
        title: "Budgets before autonomy",
        summary: "Nineteen attempts overnight taught us to put a ceiling on ambition.",
        tags: ["reliability", "cost"],
        status: PostStatus.Published,
        publishedDaysAgo: 33,
        content:
            "<p>A flaky test suite met a retry policy with no ceiling, and by morning one issue had consumed more compute than the previous week.</p><h2>What we changed</h2><p>Spend is now a per-project ceiling with a warning at eighty percent and a hard stop at a hundred. The hard stop aborts in-flight attempts rather than letting them finish.</p>",
    },
    {
        kind: PostKind.Blog,
        slug: "sandbox-escape-review",
        title: "What we look for in a sandbox escape review",
        summary: "The runner holds a real checkout and real secrets. That deserves paranoia.",
        tags: ["security"],
        status: PostStatus.Published,
        publishedDaysAgo: 48,
        content:
            "<p>A runner is a container with a clone of your repository, a scoped token and whatever secrets your build needs. Treat every one of those as a thing an attempt might try to exfiltrate.</p><h2>The checklist</h2><ul><li><p>Scopes are requested per attempt and expire with the lease.</p></li><li><p>Secrets are injected as environment variables and never written to disk.</p></li><li><p>Outbound network is default-deny with an allowlist per project.</p></li></ul>",
    },
    {
        kind: PostKind.Blog,
        slug: "hiring-engineers-who-review-agents",
        title: "We are hiring engineers who like reviewing agents",
        summary: "The job is less writing code and more deciding whether code is right.",
        tags: ["team"],
        status: PostStatus.Draft,
        publishedDaysAgo: null,
        content:
            "<p>The interesting half of this product is the review loop. If you enjoy reading a diff and asking what it does not handle, we should talk.</p>",
    },
    {
        kind: PostKind.Changelog,
        slug: "changelog-2-4-0",
        title: "Grouped board view and per-column counts",
        summary: "The board can group by status or stay flat, and every column carries a count.",
        tags: ["board"],
        status: PostStatus.Published,
        publishedDaysAgo: 2,
        version: "2.4.0",
        channel: ReleaseChannel.Stable,
        content:
            "<h2>Added</h2><ul><li><p>Grouped board view, toggled per project.</p></li><li><p>Issue counts on every column header.</p></li></ul><h2>Fixed</h2><ul><li><p>Column order no longer clobbers a concurrent drag.</p></li></ul>",
    },
    {
        kind: PostKind.Changelog,
        slug: "changelog-2-3-1",
        title: "Mentions, reactions and a quieter activity feed",
        summary: "Chat learned @member and #issue references. Noisy rows moved behind a toggle.",
        tags: ["chat", "activity"],
        status: PostStatus.Published,
        publishedDaysAgo: 9,
        version: "2.3.1",
        channel: ReleaseChannel.Stable,
        content:
            "<h2>Added</h2><ul><li><p><code>@member</code> and <code>#issue</code> references in issue and project chat.</p></li><li><p>One reaction per person per message.</p></li></ul><h2>Changed</h2><ul><li><p>Build and test rows are secondary and hide behind show details.</p></li></ul>",
    },
    {
        kind: PostKind.Changelog,
        slug: "changelog-2-3-0",
        title: "Product diffs for agent pull requests",
        summary: "See the rendered before and after for a PR the agent opened.",
        tags: ["product-diff"],
        status: PostStatus.Published,
        publishedDaysAgo: 18,
        version: "2.3.0",
        channel: ReleaseChannel.Beta,
        content:
            "<h2>Added</h2><ul><li><p>Product diffs, generated per pull request and opt-in per project.</p></li></ul><h2>Known gaps</h2><ul><li><p>Only routes reachable without authentication are captured.</p></li></ul>",
    },
    {
        kind: PostKind.Changelog,
        slug: "changelog-2-2-0",
        title: "Worker pool sizing and queue positions",
        summary: "Projects can run more than one worker, and queued issues show their place.",
        tags: ["runners", "queue"],
        status: PostStatus.Published,
        publishedDaysAgo: 27,
        version: "2.2.0",
        channel: ReleaseChannel.Stable,
        content:
            "<h2>Added</h2><ul><li><p>Configurable worker count per project.</p></li><li><p>Queue position on every queued issue.</p></li></ul>",
    },
    {
        kind: PostKind.Changelog,
        slug: "changelog-2-5-0-rc",
        title: "Spend ceilings",
        summary: "A hard stop when a project runs through its budget.",
        tags: ["cost"],
        status: PostStatus.Draft,
        publishedDaysAgo: null,
        version: "2.5.0",
        channel: ReleaseChannel.Beta,
        content:
            "<h2>Added</h2><ul><li><p>Per-project spend ceiling with a warning threshold and a hard stop.</p></li></ul>",
    },
] as const;

function plainText(html: string): string {
    return html
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function readingTime(text: string): number {
    return Math.max(1, Math.round(text.split(" ").length / 220));
}

async function reset() {
    const org = await prisma.organization.findUnique({ where: { slug: ORG.slug } });
    if (org) await prisma.organization.delete({ where: { id: org.id } });

    await prisma.notification.deleteMany({
        where: { payload: { path: ["orgSlug"], equals: ORG.slug } },
    });
    await prisma.post.deleteMany({ where: { slug: { in: POSTS.map((post) => post.slug) } } });
    await prisma.apiKey.deleteMany({ where: { label: { startsWith: "Nocturn " } } });
    await prisma.user.deleteMany({ where: { email: { endsWith: `@${SEED_EMAIL_DOMAIN}` } } });
}

async function main() {
    await reset();

    const humans = await prisma.user.findMany({
        where: { email: { not: { endsWith: `@${SEED_EMAIL_DOMAIN}` } } },
        select: { id: true, name: true, email: true, image: true },
        orderBy: { createdAt: "asc" },
    });

    const cast: Person[] = [];
    for (const name of PEOPLE) {
        const email = `${slugify(name)}@${SEED_EMAIL_DOMAIN}`;
        const user = await prisma.user.create({
            data: {
                name,
                email,
                emailVerified: daysAgo(between(40, 300)),
                setupComplete: true,
            },
            select: { id: true, name: true, image: true, email: true },
        });
        cast.push({ id: user.id, name: user.name ?? name, image: user.image, email: user.email });
    }

    const people: Person[] = [
        ...humans.map((human) => ({
            id: human.id,
            name: human.name ?? human.email,
            image: human.image,
            email: human.email,
        })),
        ...cast,
    ];
    const lead = people[0];

    const organization = await prisma.organization.create({
        data: {
            name: ORG.name,
            slug: ORG.slug,
            description: ORG.description,
            createdById: lead.id,
            createdAt: daysAgo(210),
            members: {
                create: people.map((person, index) => ({
                    userId: person.id,
                    role:
                        index === 0 || humans.some((human) => human.id === person.id)
                            ? OrgRole.Owner
                            : index % 9 === 0
                              ? OrgRole.Admin
                              : index % 17 === 0
                                ? OrgRole.Billing
                                : OrgRole.Member,
                })),
            },
        },
    });
    const orgId = organization.id;

    const project = await prisma.project.create({
        data: {
            orgId,
            name: PROJECT.name,
            slug: PROJECT.slug,
            summary: PROJECT.summary,
            description: PROJECT.description,
            icon: PROJECT.icon,
            ownerId: lead.id,
            createdById: lead.id,
            tourCompleted: true,
            githubRepoId: PROJECT.repoId,
            githubRepoFullName: PROJECT.repoFullName,
            githubRepoUrl: PROJECT.repoUrl,
            githubDefaultBranch: PROJECT.defaultBranch,
            maxWorkers: 3,
            createdAt: daysAgo(196),
            planStatus: PlanStatus.Ready,
            planCommitSha: "8f31c0ade4b17c2d9a55e6b0f4c81d7e2ab93f10",
            planGeneratedAt: daysAgo(6),
            planMd: [
                "# Nocturn — agent plan",
                "",
                "## Stack",
                "Bun workspaces. `apps/api` is Express on Bun, `apps/dashboard` is Next.js, `packages/db` is Prisma against Postgres 16.",
                "",
                "## Commands",
                "- install: `bun install`",
                "- build: `bun run build`",
                "- test: `bun run test`",
                "- lint: `bun run lint`",
                "",
                "## Conventions",
                "Four-space indent, double quotes, no code comments. Every endpoint answers through the response envelope in `apps/api/src/services/response.ts`.",
                "",
                "## Verification",
                "An attempt is only green when `bun run test` and `bun run lint` both pass on the branch.",
            ].join("\n"),
            projectConfig: {
                create: {
                    kanbanOptionView: KanbanOptionView.FLAT,
                    productDiffEnabled: true,
                },
            },
            members: {
                create: people.map((person, index) => ({
                    userId: person.id,
                    role:
                        index === 0 || humans.some((human) => human.id === person.id)
                            ? ProjectRole.Admin
                            : pick([
                                  ProjectRole.Write,
                                  ProjectRole.Write,
                                  ProjectRole.Maintain,
                                  ProjectRole.Triage,
                                  ProjectRole.Read,
                              ]),
                })),
            },
        },
    });
    const projectId = project.id;

    const memberRows = await prisma.projectMember.findMany({
        where: { projectId },
        select: { id: true, userId: true },
    });
    const memberIdByUser: Record<string, string> = {};
    for (const row of memberRows) memberIdByUser[row.userId] = row.id;

    const HUMAN_TEAMS = ["runners", "agent-core", "web"];
    for (const [name, slug, description] of TEAMS) {
        const roster = pickMany(cast, between(4, 9));
        const humanRoster = HUMAN_TEAMS.includes(slug) ? humans : [];
        await prisma.team.create({
            data: {
                projectId,
                name,
                slug,
                description,
                createdAt: daysAgo(between(60, 190)),
                members: {
                    create: [
                        ...humanRoster.map((human) => ({
                            userId: human.id,
                            role: TeamRole.Maintainer,
                        })),
                        ...roster.map((person) => ({
                            userId: person.id,
                            role: chance(0.25) ? TeamRole.Maintainer : TeamRole.Member,
                        })),
                    ],
                },
            },
        });
    }

    const tags = [];
    for (const [name, color] of TAGS) {
        tags.push(await prisma.tag.create({ data: { projectId, name, color } }));
    }

    const space = await prisma.space.create({
        data: { projectId, name: SPACE.name, slug: SPACE.slug, order: 1 },
    });

    const columns: CustomColumn[] = [];
    for (let index = 0; index < COLUMNS.length; index++) {
        columns.push(
            await prisma.customColumn.create({
                data: { spaceId: space.id, label: COLUMNS[index], order: index + 1 },
            }),
        );
    }

    for (const human of humans) {
        await prisma.customColumnOrder.createMany({
            data: [
                { userId: human.id, spaceId: space.id, columnId: columns[1].id, order: 1 },
                { userId: human.id, spaceId: space.id, columnId: columns[0].id, order: 2 },
            ],
        });
    }

    for (const template of TEMPLATES) {
        await prisma.issueTemplate.create({
            data: {
                projectId,
                name: template.name,
                description: template.description,
                icon: template.icon,
                isDefault: template.isDefault,
                createdAt: daysAgo(between(20, 150)),
            },
        });
    }

    const workers = [];
    const workerPlan = [
        { status: WorkerStatus.Busy, specialization: "backend", sandboxId: "sbx_7fc19ad3e2" },
        { status: WorkerStatus.Busy, specialization: "frontend", sandboxId: "sbx_2b40e7c918" },
        { status: WorkerStatus.Idle, specialization: "infra", sandboxId: "sbx_9de0142ab7" },
        { status: WorkerStatus.Booting, specialization: "agent", sandboxId: null },
        { status: WorkerStatus.Dead, specialization: "backend", sandboxId: null },
    ] as const;
    for (const plan of workerPlan) {
        workers.push(
            await prisma.worker.create({
                data: {
                    projectId,
                    status: plan.status,
                    specialization: plan.specialization,
                    sandboxId: plan.sandboxId,
                    nextQueuePos: 1,
                    leaseExpiresAt:
                        plan.status === WorkerStatus.Busy ? minutesAgo(-between(4, 45)) : null,
                    contextSummary: {
                        queuedCount: between(0, 6),
                        currentSpecialization: plan.specialization,
                        recentFilesEdited: [
                            "apps/api/src/services/queue.ts",
                            "packages/db/prisma/schema.prisma",
                            "apps/dashboard/components/Board.tsx",
                        ].slice(0, between(1, 3)),
                        lastIssueFixed: `Fixed the ${plan.specialization} retry path`,
                    },
                    contextBlobUrl:
                        plan.status === WorkerStatus.Dead
                            ? null
                            : `https://artifacts.trymatcha.dev/workers/${plan.sandboxId ?? "pending"}/context.jsonl`,
                    createdAt: daysAgo(between(1, 20)),
                },
            }),
        );
    }
    const busyWorkers = workers.filter((worker) => worker.status === WorkerStatus.Busy);
    const idleWorker = workers.find((worker) => worker.status === WorkerStatus.Idle)!;

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

    const statusRoll: IssueStatus[] = [];
    for (const [status, count] of STATUS_PLAN) {
        for (let index = 0; index < count; index++) statusRoll.push(status);
    }

    type CreatedIssue = {
        id: string;
        number: number;
        title: string;
        status: IssueStatus;
        prUrl: string | null;
        assigneeIds: string[];
        creatorId: string;
    };

    const activityRows: Array<{
        issueId: string;
        type: ActivityType;
        payload: object;
        actorType: ActorType;
        actorUserId: string | null;
        actorWorkerId: string | null;
        sessionId: string | null;
        surface: ActivitySurface;
        createdAt: Date;
    }> = [];
    const chatSeeds: Array<{
        issueId: string;
        senderId: string;
        message: string;
        createdAt: Date;
        replies: Array<{ senderId: string; message: string; createdAt: Date }>;
    }> = [];
    const createdIssues: CreatedIssue[] = [];

    let parkedIndex = 0;
    let queuePosition = 1;

    for (let index = 0; index < specs.length; index++) {
        const spec = specs[index];
        const status = statusRoll[index] ?? IssueStatus.Todo;
        const openedDaysAgo = between(1, 120);
        const createdAt = daysAgo(openedDaysAgo, between(0, 600));
        const humanTurn = humans.length ? index % (humans.length * 7) : -1;
        const creator =
            humanTurn >= 0 && humanTurn < humans.length
                ? people[humanTurn]
                : pick(people.slice(humans.length));
        const assignees = pickMany(people, between(0, 3));
        for (const human of humans) {
            if (index % 6 === humans.indexOf(human) && !assignees.some((a) => a.id === human.id)) {
                const match = people.find((person) => person.id === human.id);
                if (match) assignees.push(match);
            }
        }
        const issueTags = pickMany(tags, between(1, 4));
        const column =
            status === IssueStatus.Parked ? columns[parkedIndex++ % columns.length] : null;
        const priority = pick([1, 2, 2, 3, 3, 3, 4]);
        const hasDates = chance(0.55);
        const startDate = hasDates ? daysAgo(openedDaysAgo - between(0, 3)) : null;
        const targetDate = hasDates ? daysAgo(openedDaysAgo - between(6, 40)) : null;
        const resolved = status === IssueStatus.Done;
        const hasPr = status === IssueStatus.InReview || resolved;
        const prUrl = hasPr ? `${PROJECT.repoUrl}/pull/${between(120, 980)}` : null;
        const specialization = AGENT_WORKED_STATUSES.includes(status)
            ? pick(SPECIALIZATIONS)
            : chance(0.3)
              ? pick(SPECIALIZATIONS)
              : null;

        const worker =
            status === IssueStatus.Queued
                ? idleWorker
                : status === IssueStatus.InProgress
                  ? busyWorkers[index % busyWorkers.length]
                  : null;

        const issue = await prisma.issue.create({
            data: {
                projectId,
                number: index + 1,
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
                agentDoneAt: hasPr ? daysAgo(Math.max(0, openedDaysAgo - between(1, 10))) : null,
                prUrl,
                prBranch: hasPr ? `matcha/issue-${index + 1}` : null,
                specialization,
                assignerWorkerId: worker?.id ?? null,
                queuePosition: worker ? queuePosition++ : null,
                assignees: { connect: assignees.map((person) => ({ id: person.id })) },
                tags: { connect: issueTags.map((tag) => ({ id: tag.id })) },
            },
            select: { id: true, number: true, title: true },
        });
        createdIssues.push({
            id: issue.id,
            number: issue.number,
            title: issue.title,
            status,
            prUrl,
            assigneeIds: assignees.map((person) => person.id),
            creatorId: creator.id,
        });

        const snapshot = (person: Person) => ({ name: person.name, image: person.image });
        let cursor = createdAt.getTime();
        const step = () => {
            cursor += between(20, 400) * 60_000;
            return new Date(Math.min(cursor, NOW));
        };
        const humanRow = (
            type: ActivityType,
            payload: object,
            person: Person,
            surface: ActivitySurface = ActivitySurface.Primary,
        ) =>
            activityRows.push({
                issueId: issue.id,
                type,
                payload: { ...payload, actor: snapshot(person) },
                actorType: ActorType.User,
                actorUserId: person.id,
                actorWorkerId: null,
                sessionId: null,
                surface,
                createdAt: step(),
            });
        const agentRow = (
            type: ActivityType,
            payload: object,
            sessionId: string | null,
            workerId: string | null,
            surface: ActivitySurface = ActivitySurface.Primary,
        ) =>
            activityRows.push({
                issueId: issue.id,
                type,
                payload: { ...payload, actor: { name: "matcha", image: null } },
                actorType: ActorType.Agent,
                actorUserId: null,
                actorWorkerId: workerId,
                sessionId,
                surface,
                createdAt: step(),
            });
        const systemRow = (
            type: ActivityType,
            payload: object,
            surface: ActivitySurface = ActivitySurface.Primary,
        ) =>
            activityRows.push({
                issueId: issue.id,
                type,
                payload,
                actorType: ActorType.System,
                actorUserId: null,
                actorWorkerId: null,
                sessionId: null,
                surface,
                createdAt: step(),
            });
        const githubRow = (
            type: ActivityType,
            payload: object,
            surface: ActivitySurface = ActivitySurface.Primary,
        ) =>
            activityRows.push({
                issueId: issue.id,
                type,
                payload,
                actorType: ActorType.Github,
                actorUserId: null,
                actorWorkerId: null,
                sessionId: null,
                surface,
                createdAt: step(),
            });

        activityRows.push({
            issueId: issue.id,
            type: ActivityType.IssueCreated,
            payload: { actor: snapshot(creator) },
            actorType: ActorType.User,
            actorUserId: creator.id,
            actorWorkerId: null,
            sessionId: null,
            surface: ActivitySurface.Primary,
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
                pick(people),
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
                pick(people),
            );
        }
        if (chance(0.4)) {
            humanRow(ActivityType.PriorityChanged, { from: 3, to: priority }, pick(people));
        }
        if (chance(0.25)) {
            humanRow(ActivityType.DescriptionChanged, {}, creator);
        }
        if (chance(0.18)) {
            humanRow(
                ActivityType.TitleChanged,
                { from: `${spec.title} (draft)`, to: spec.title },
                creator,
            );
        }
        if (chance(0.14) && assignees.length) {
            const dropped = assignees[0];
            humanRow(
                ActivityType.AssigneeRemoved,
                { user: { id: dropped.id, name: dropped.name, image: dropped.image } },
                pick(people),
            );
        }
        if (chance(0.12) && issueTags.length > 1) {
            const dropped = issueTags[issueTags.length - 1];
            humanRow(
                ActivityType.LabelRemoved,
                { label: { id: dropped.id, name: dropped.name, color: dropped.color } },
                pick(people),
            );
        }
        if (specialization && chance(0.3)) {
            humanRow(ActivityType.SpecializationChanged, { to: specialization }, pick(people));
        }
        if (chance(0.2)) {
            systemRow(
                ActivityType.RelationAdded,
                { relation: "blocks", issueNumber: between(1, ISSUE_COUNT) },
                ActivitySurface.Secondary,
            );
        }

        for (const next of STATUS_FLOW[status] ?? []) {
            humanRow(
                ActivityType.StatusChanged,
                {
                    from: { kind: "status", status: IssueStatus.Todo },
                    to: { kind: "status", status: next },
                },
                pick(people),
            );
        }
        if (column) {
            humanRow(
                ActivityType.ColumnChanged,
                {
                    from: { kind: "status", status: IssueStatus.Todo },
                    to: { kind: "column", id: column.id, label: column.label },
                },
                pick(people),
            );
        }
        if (worker) {
            systemRow(ActivityType.Queued, { queuePosition: queuePosition - 1 });
            systemRow(
                ActivityType.Routed,
                { workerId: worker.id, specialization: worker.specialization },
                ActivitySurface.Secondary,
            );
        }

        if (AGENT_WORKED_STATUSES.includes(status)) {
            const attempts = status === IssueStatus.Failed ? between(2, 3) : between(1, 2);
            for (let attempt = 1; attempt <= attempts; attempt++) {
                const failed = status === IssueStatus.Failed || attempt < attempts;
                const runner = worker ?? pick(workers);
                const session = await prisma.agentSession.create({
                    data: {
                        id: `${issue.id}-attempt-${attempt}`,
                        issueId: issue.id,
                        workerId: runner.id,
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
                        traceUrl: `https://artifacts.trymatcha.dev/sessions/${issue.id}-${attempt}/trace.jsonl`,
                        error: failed ? "verification_failed" : null,
                        startedAt: step(),
                        endedAt: step(),
                    },
                });
                agentRow(
                    ActivityType.RunStarted,
                    { attemptNumber: attempt },
                    session.id,
                    runner.id,
                );
                agentRow(ActivityType.BranchCreated, {}, session.id, runner.id);
                if (chance(0.5)) {
                    agentRow(
                        ActivityType.ScopeRequested,
                        { scope: "packages/db write" },
                        session.id,
                        runner.id,
                        ActivitySurface.Secondary,
                    );
                    agentRow(
                        ActivityType.ScopeGranted,
                        { scope: "packages/db write" },
                        session.id,
                        runner.id,
                        ActivitySurface.Audit,
                    );
                }
                agentRow(
                    chance(0.75) ? ActivityType.BugReproduced : ActivityType.BugNotReproduced,
                    {},
                    session.id,
                    runner.id,
                );
                agentRow(
                    ActivityType.BuildResult,
                    { ok: !failed },
                    session.id,
                    runner.id,
                    ActivitySurface.Secondary,
                );
                if (failed) {
                    agentRow(
                        ActivityType.TestResult,
                        { ok: false, failed: between(1, 4) },
                        session.id,
                        runner.id,
                        ActivitySurface.Secondary,
                    );
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
                        runner.id,
                    );
                    if (chance(0.3)) {
                        systemRow(ActivityType.WorkerHandoff, {
                            fromWorkerId: runner.id,
                            toWorkerId: pick(workers).id,
                        });
                    }
                } else {
                    agentRow(
                        ActivityType.CommitsPushed,
                        { count: between(1, 5) },
                        session.id,
                        runner.id,
                        ActivitySurface.Secondary,
                    );
                    agentRow(
                        ActivityType.TestResult,
                        { ok: true, passed: between(40, 320) },
                        session.id,
                        runner.id,
                        ActivitySurface.Secondary,
                    );
                    agentRow(
                        ActivityType.AcceptanceChecked,
                        {},
                        session.id,
                        runner.id,
                        ActivitySurface.Secondary,
                    );
                    agentRow(
                        ActivityType.RunCompleted,
                        { attemptNumber: attempt, summary: session.summary ?? undefined },
                        session.id,
                        runner.id,
                    );
                    if (prUrl) {
                        agentRow(ActivityType.PrOpened, { url: prUrl }, session.id, runner.id);
                    }
                }
            }
            if (chance(0.22)) {
                systemRow(
                    ActivityType.BudgetThresholdCrossed,
                    { threshold: 0.8 },
                    ActivitySurface.Secondary,
                );
            }
            if (chance(0.08)) {
                systemRow(ActivityType.GuardrailHit, { guardrail: "network_allowlist" });
            }
        }

        if (prUrl) {
            if (chance(0.6)) githubRow(ActivityType.PrReviewReceived, { url: prUrl });
            if (chance(0.3)) {
                githubRow(ActivityType.PrChecksFailed, { url: prUrl }, ActivitySurface.Secondary);
                agentRow(ActivityType.PrFeedbackAddressed, { url: prUrl }, null, null);
            }
        }
        if (resolved) {
            githubRow(ActivityType.PrMerged, { url: prUrl ?? "" });
            humanRow(ActivityType.IssueResolved, {}, pick(people));
            if (chance(0.1)) {
                humanRow(ActivityType.IssueReopened, {}, pick(people));
            }
        }
        if (status === IssueStatus.Cancelled) {
            humanRow(ActivityType.IssueCancelled, {}, pick(people));
        }
        if (status === IssueStatus.Failed && chance(0.4)) {
            humanRow(ActivityType.HumanTookOver, {}, pick(people));
        }
        if (status === IssueStatus.Queued && chance(0.3)) {
            systemRow(ActivityType.Starved, { waitingMinutes: between(30, 900) });
        }

        const commentCount = between(0, 5);
        for (let comment = 0; comment < commentCount; comment++) {
            const sender = pick(people);
            const at = step();
            chatSeeds.push({
                issueId: issue.id,
                senderId: sender.id,
                message: pick(CHAT_LINES),
                createdAt: at,
                replies: Array.from({ length: chance(0.45) ? between(1, 3) : 0 }, () => ({
                    senderId: pick(people).id,
                    message: pick(REPLY_LINES),
                    createdAt: new Date(at.getTime() + between(5, 900) * 60_000),
                })),
            });
        }
    }

    const paginationIssueRows: Array<{
        projectId: string;
        number: number;
        createdById: string;
        title: string;
        description: string;
        status: IssueStatus;
        priority: number;
        customColumnId: string | null;
        createdAt: Date;
    }> = [];
    let paginationIssueNumber = specs.length + 1;
    const systemLanes = STATUS_PLAN.filter(([status]) => status !== IssueStatus.Parked).map(
        ([status, count]) => ({ status, customColumnId: null, count, label: status }),
    );
    const customLanes = columns.map((column, index) => ({
        status: IssueStatus.Parked,
        customColumnId: column.id,
        count: statusRoll
            .filter((status) => status === IssueStatus.Parked)
            .filter((_, parkedIndex) => parkedIndex % columns.length === index).length,
        label: column.label,
    }));

    const paginationLanes = [...systemLanes, ...customLanes];
    for (let laneIndex = 0; laneIndex < paginationLanes.length; laneIndex++) {
        const lane = paginationLanes[laneIndex];
        for (
            let laneIssueIndex = lane.count;
            laneIssueIndex < ISSUES_PER_BOARD_LANE;
            laneIssueIndex++
        ) {
            const issueNumber = paginationIssueNumber++;
            paginationIssueRows.push({
                projectId,
                number: issueNumber,
                createdById: people[issueNumber % people.length].id,
                title: `${lane.label} pagination fixture ${laneIssueIndex + 1}`,
                description: paragraph(
                    `Seeded card ${laneIssueIndex + 1} for testing automatic pagination and virtualized rendering in ${lane.label}.`,
                ),
                status: lane.status,
                priority: (laneIssueIndex % 4) + 1,
                customColumnId: lane.customColumnId,
                createdAt: daysAgo(121 + laneIndex * ISSUES_PER_BOARD_LANE + laneIssueIndex),
            });
        }
    }
    await prisma.issue.createMany({ data: paginationIssueRows });

    activityRows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    await prisma.issueActivity.createMany({ data: activityRows });

    const chats: Array<{ id: string; issueId: string; senderId: string; message: string }> = [];
    for (const seedChat of chatSeeds) {
        const mentionedMemberId = chance(0.24) ? memberIdByUser[pick(people).id] : undefined;
        const referencedIssue = chance(0.16) ? pick(createdIssues) : undefined;
        const message = [
            seedChat.message,
            mentionedMemberId ? `@[member:${mentionedMemberId}]` : null,
            referencedIssue ? `#[issue:${referencedIssue.id}]` : null,
        ]
            .filter(Boolean)
            .join(" ");

        const root = await prisma.chat.create({
            data: {
                issueId: seedChat.issueId,
                senderId: seedChat.senderId,
                message,
                isDeleted: chance(0.04),
                createdAt: seedChat.createdAt,
                references: {
                    create: [
                        ...(mentionedMemberId ? [{ memberId: mentionedMemberId }] : []),
                        ...(referencedIssue ? [{ issueId: referencedIssue.id }] : []),
                    ],
                },
            },
            select: { id: true },
        });
        chats.push({
            id: root.id,
            issueId: seedChat.issueId,
            senderId: seedChat.senderId,
            message: seedChat.message,
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
        for (const reactor of pickMany(people, chance(0.5) ? between(1, 4) : 0)) {
            await prisma.chatReaction.create({
                data: { chatId: root.id, userId: reactor.id, emoji: pick(EMOJIS) },
            });
        }
    }

    const projectChats: Array<{ id: string; senderId: string; message: string }> = [];
    for (let index = 0; index < PROJECT_CHAT_COUNT; index++) {
        const sender = pick(people);
        const at = daysAgo(between(0, 45), between(0, 900));
        const mentionedMemberId = chance(0.28) ? memberIdByUser[pick(people).id] : undefined;
        const referencedIssue = chance(0.22) ? pick(createdIssues) : undefined;
        const body = pick(PROJECT_CHAT_LINES);
        const message = [
            body,
            mentionedMemberId ? `@[member:${mentionedMemberId}]` : null,
            referencedIssue ? `#[issue:${referencedIssue.id}]` : null,
        ]
            .filter(Boolean)
            .join(" ");

        const root = await prisma.projectChat.create({
            data: {
                projectId,
                senderId: sender.id,
                message,
                createdAt: at,
                references: {
                    create: [
                        ...(mentionedMemberId ? [{ memberId: mentionedMemberId }] : []),
                        ...(referencedIssue ? [{ issueId: referencedIssue.id }] : []),
                    ],
                },
            },
            select: { id: true },
        });
        projectChats.push({ id: root.id, senderId: sender.id, message: body });

        const replyCount = chance(0.4) ? between(1, 3) : 0;
        for (let reply = 0; reply < replyCount; reply++) {
            await prisma.projectChat.create({
                data: {
                    projectId,
                    senderId: pick(people).id,
                    message: pick(REPLY_LINES),
                    repliedToId: root.id,
                    createdAt: new Date(at.getTime() + between(3, 600) * 60_000),
                },
            });
        }
        for (const reactor of pickMany(people, chance(0.45) ? between(1, 3) : 0)) {
            await prisma.projectChatReaction.create({
                data: { projectChatId: root.id, userId: reactor.id, emoji: pick(EMOJIS) },
            });
        }
    }

    let descriptionReferenceCount = 0;
    for (const issue of pickMany(createdIssues, 16)) {
        const target = pick(createdIssues.filter((candidate) => candidate.id !== issue.id));
        const memberId = memberIdByUser[pick(people).id];
        if (!target || !memberId) continue;
        const current = await prisma.issue.findUnique({
            where: { id: issue.id },
            select: { description: true },
        });
        if (!current) continue;
        await prisma.issue.update({
            where: { id: issue.id },
            data: {
                description: `${current.description}<p>Blocked on #[issue:${target.id}] — @[member:${memberId}] has the context.</p>`,
                descriptionReferences: {
                    create: [{ referencedIssueId: target.id }, { memberId }],
                },
            },
        });
        descriptionReferenceCount += 2;
    }

    const prIssues = createdIssues.filter((issue) => issue.prUrl);
    const diffPlan = [
        ProductDiffStatus.Ready,
        ProductDiffStatus.Generating,
        ProductDiffStatus.Pending,
        ProductDiffStatus.Failed,
        ProductDiffStatus.Stale,
        ProductDiffStatus.Pending,
        ProductDiffStatus.Generating,
    ];
    let diffCount = 0;
    for (let index = 0; index < diffPlan.length && index < prIssues.length; index++) {
        const issue = prIssues[index];
        const status = diffPlan[index];
        const pullNumber = Number(issue.prUrl!.split("/").pop());
        await prisma.productDiff.create({
            data: {
                issueId: issue.id,
                pullNumber,
                baseSha: `${index}fa3c17be9d40a2e5c8b1706d3f4ab29c05e81d`.slice(0, 40),
                headSha: `${index}9b7e42dc10f5a836be04c19d7f2a5308ce16b4`.slice(0, 40),
                status,
                artifactPrefix:
                    status === ProductDiffStatus.Ready
                        ? `product-diffs/${issue.id}/${pullNumber}`
                        : null,
                manifest:
                    status === ProductDiffStatus.Ready
                        ? {
                              targets: [
                                  {
                                      id: "board",
                                      label: "Board",
                                      states: [
                                          { id: "default", label: "Default" },
                                          { id: "grouped", label: "Grouped view" },
                                      ],
                                  },
                                  {
                                      id: "issue",
                                      label: "Issue detail",
                                      states: [{ id: "default", label: "Default" }],
                                  },
                              ],
                              warnings: index === 0 ? ["Authenticated routes were skipped."] : [],
                          }
                        : undefined,
                error:
                    status === ProductDiffStatus.Failed
                        ? "Dashboard build exited 1 before any route could be captured."
                        : null,
                createdAt: daysAgo(between(1, 14)),
            },
        });
        diffCount++;
    }

    const setupSession = await prisma.setupSession.create({
        data: {
            projectId,
            status: SetupStatus.WaitingOnUser,
            sandboxId: "sbx_setup_41c8ae02",
            snapshotId: null,
            infrastructureMd: [
                "# infrastructure.md",
                "",
                "## Detected",
                "- Bun workspaces with three packages",
                "- Postgres 16 required at `DATABASE_URL`",
                "- Redis required at `REDIS_URL`",
                "",
                "## Boot",
                "1. `bun install`",
                "2. `bun run db:migrate:deploy`",
                "3. `bun run dev`",
                "",
                "## Baseline",
                "`bun run test` — 284 passing, 0 failing.",
            ].join("\n"),
            startedAt: daysAgo(1, 30),
            createdAt: daysAgo(1, 30),
            questions: {
                create: [
                    {
                        type: SetupQuestionType.NeedSecret,
                        key: "DATABASE_URL",
                        prompt: "The API will not boot without a Postgres connection string. Which database should the sandbox point at?",
                        options: [],
                        status: SetupQuestionStatus.Answered,
                        askedAt: daysAgo(1, 25),
                        answeredAt: daysAgo(1, 10),
                    },
                    {
                        type: SetupQuestionType.NeedChoice,
                        key: "START_COMMAND",
                        prompt: "Two dev scripts exist. Which one brings up the full stack?",
                        options: ["bun run dev", "bun run dev:api", "bun run start"],
                        status: SetupQuestionStatus.Answered,
                        answerValue: "bun run dev",
                        askedAt: daysAgo(1, 20),
                        answeredAt: daysAgo(1, 8),
                    },
                    {
                        type: SetupQuestionType.DefineSuccess,
                        key: "VERIFICATION",
                        prompt: "What counts as a green run for this repo?",
                        options: [],
                        status: SetupQuestionStatus.Waiting,
                        askedAt: minutesAgo(38),
                    },
                    {
                        type: SetupQuestionType.ApproveCost,
                        key: "SANDBOX_BUDGET",
                        prompt: "The baseline build takes about nine minutes of sandbox time. Approve?",
                        options: ["Approve", "Reduce scope"],
                        status: SetupQuestionStatus.Waiting,
                        askedAt: minutesAgo(22),
                    },
                    {
                        type: SetupQuestionType.NeedAccess,
                        key: "PRIVATE_REGISTRY",
                        prompt: "Two dependencies resolve from a private registry the sandbox cannot reach.",
                        options: [],
                        status: SetupQuestionStatus.Cancelled,
                        askedAt: daysAgo(1, 5),
                    },
                ],
            },
        },
    });

    const SECRETS = ["DATABASE_URL", "REDIS_URL", "NPM_TOKEN", "STRIPE_SECRET_KEY"];
    for (const key of SECRETS) {
        await prisma.projectSecret.create({
            data: {
                projectId,
                key,
                ciphertext: Buffer.from(`seeded-${key}-value`).toString("base64"),
                iv: Buffer.from(`iv-${key}`).toString("base64").slice(0, 16),
                authTag: Buffer.from(`tag-${key}`).toString("base64").slice(0, 22),
            },
        });
    }

    const INVITES = [
        { email: "noor.abbasi@example.com", status: InvitationStatus.Pending },
        { email: "greg.holloway@example.com", status: InvitationStatus.Pending },
        { email: "yuki.tanaka@example.com", status: InvitationStatus.Pending },
        { email: "sara.mendes@example.com", status: InvitationStatus.Accepted },
        { email: "will.byrne@example.com", status: InvitationStatus.Rejected },
    ];
    const teams = await prisma.team.findMany({ where: { projectId } });
    for (let index = 0; index < INVITES.length; index++) {
        const invite = INVITES[index];
        await prisma.invitation.create({
            data: {
                email: invite.email,
                status: invite.status,
                expiresAt: daysAgo(-between(3, 12)),
                invitedById: lead.id,
                orgId,
                projectId,
                role: pick([ProjectRole.Write, ProjectRole.Triage, ProjectRole.Read]),
                teamId: index % 2 === 0 ? teams[index % teams.length].id : null,
                createdAt: daysAgo(between(1, 9)),
            },
        });
    }

    const notifications: Array<{
        userId: string;
        type: NotificationType;
        payload: object;
        readAt: Date | null;
        createdAt: Date;
    }> = [];

    const seeded_notification_project_id = (type: NotificationType, payload: object) => {
        if (NOTIFICATION_SCOPE[type] !== NotificationScope.Project) return null;
        const { projectId } = payload as { projectId?: string };
        return projectId ?? null;
    };

    for (const human of humans) {
        const actorFor = () => {
            const actor = pick(cast);
            return { id: actor.id, name: actor.name };
        };
        const issueBase = (issue: CreatedIssue) => ({
            issueId: issue.id,
            issueTitle: issue.title,
            issueNumber: issue.number,
            projectId,
            projectSlug: PROJECT.slug,
            orgSlug: ORG.slug,
        });

        const builders: Array<() => { type: NotificationType; payload: object }> = [
            () => {
                const issue = pick(createdIssues);
                const actor = actorFor();
                return {
                    type: NotificationType.IssueAssigned,
                    payload: {
                        ...issueBase(issue),
                        actorId: actor.id,
                        actorName: actor.name,
                    },
                };
            },
            () => {
                const issue = pick(createdIssues);
                const actor = actorFor();
                return {
                    type: NotificationType.IssueUnassigned,
                    payload: { ...issueBase(issue), actorId: actor.id, actorName: actor.name },
                };
            },
            () => {
                const chat = pick(chats);
                const issue =
                    createdIssues.find((candidate) => candidate.id === chat.issueId) ??
                    createdIssues[0];
                const actor = actorFor();
                return {
                    type: NotificationType.ChatMention,
                    payload: {
                        chatId: chat.id,
                        ...issueBase(issue),
                        senderId: actor.id,
                        senderName: actor.name,
                        message: `${chat.message} @${human.name ?? human.email}`,
                    },
                };
            },
            () => {
                const chat = pick(projectChats);
                const actor = actorFor();
                return {
                    type: NotificationType.ProjectChatMention,
                    payload: {
                        projectChatId: chat.id,
                        projectId,
                        projectSlug: PROJECT.slug,
                        orgSlug: ORG.slug,
                        senderId: actor.id,
                        senderName: actor.name,
                        message: `${chat.message} @${human.name ?? human.email}`,
                    },
                };
            },
            () => {
                const issue = pick(createdIssues);
                const actor = actorFor();
                return {
                    type: NotificationType.IssueStatusChanged,
                    payload: {
                        ...issueBase(issue),
                        actorId: actor.id,
                        actorName: actor.name,
                        fromStatus: IssueStatus.InProgress,
                        toStatus: issue.status,
                    },
                };
            },
            () => {
                const issue = pick(createdIssues);
                const actor = actorFor();
                return {
                    type: NotificationType.IssuePriorityChanged,
                    payload: {
                        ...issueBase(issue),
                        actorId: actor.id,
                        actorName: actor.name,
                        priority: between(1, 4),
                    },
                };
            },
            () => {
                const issue = pick(createdIssues);
                const actor = actorFor();
                return {
                    type: NotificationType.IssueMoved,
                    payload: {
                        ...issueBase(issue),
                        actorId: actor.id,
                        actorName: actor.name,
                        toColumnLabel: pick(columns).label,
                    },
                };
            },
            () => {
                const chat = pick(chats);
                const issue =
                    createdIssues.find((candidate) => candidate.id === chat.issueId) ??
                    createdIssues[0];
                const actor = actorFor();
                return {
                    type: NotificationType.IssueCommented,
                    payload: {
                        chatId: chat.id,
                        ...issueBase(issue),
                        senderId: actor.id,
                        senderName: actor.name,
                        message: chat.message,
                    },
                };
            },
            () => {
                const issue = pick(createdIssues);
                const actor = actorFor();
                return {
                    type: NotificationType.IssueReferenced,
                    payload: {
                        ...issueBase(issue),
                        senderId: actor.id,
                        senderName: actor.name,
                        message: `Same root cause as #${issue.number} ${issue.title}`,
                    },
                };
            },
            () => {
                const issue = pick(createdIssues);
                const actor = actorFor();
                return {
                    type: NotificationType.IssueDeleted,
                    payload: { ...issueBase(issue), actorId: actor.id, actorName: actor.name },
                };
            },
            () => {
                const actor = actorFor();
                return {
                    type: NotificationType.AddedToProject,
                    payload: {
                        projectId,
                        projectName: PROJECT.name,
                        projectSlug: PROJECT.slug,
                        orgId,
                        orgName: ORG.name,
                        orgSlug: ORG.slug,
                        role: ProjectRole.Admin,
                        actorId: actor.id,
                        actorName: actor.name,
                    },
                };
            },
            () => {
                const team = pick(teams);
                const actor = actorFor();
                return {
                    type: NotificationType.AddedToTeam,
                    payload: {
                        teamId: team.id,
                        teamName: team.name,
                        projectId,
                        projectName: PROJECT.name,
                        projectSlug: PROJECT.slug,
                        orgName: ORG.name,
                        orgSlug: ORG.slug,
                        actorId: actor.id,
                        actorName: actor.name,
                    },
                };
            },
            () => {
                const team = pick(teams);
                const actor = actorFor();
                return {
                    type: NotificationType.RemovedFromTeam,
                    payload: {
                        teamId: team.id,
                        teamName: team.name,
                        projectId,
                        projectSlug: PROJECT.slug,
                        orgName: ORG.name,
                        orgSlug: ORG.slug,
                        actorId: actor.id,
                        actorName: actor.name,
                    },
                };
            },
            () => {
                const team = pick(teams);
                const actor = actorFor();
                return {
                    type: NotificationType.RoleChanged,
                    payload: {
                        teamId: team.id,
                        teamName: team.name,
                        projectId,
                        projectSlug: PROJECT.slug,
                        orgSlug: ORG.slug,
                        role: TeamRole.Maintainer,
                        previousRole: TeamRole.Member,
                        actorId: actor.id,
                        actorName: actor.name,
                    },
                };
            },
            () => {
                const actor = actorFor();
                return {
                    type: NotificationType.RemovedFromOrg,
                    payload: {
                        orgId,
                        orgName: ORG.name,
                        orgSlug: ORG.slug,
                        actorId: actor.id,
                        actorName: actor.name,
                    },
                };
            },
            () => {
                const actor = actorFor();
                const team = pick(teams);
                return {
                    type: NotificationType.InviteAccepted,
                    payload: {
                        invitationId: `seeded-invite-${between(1000, 9999)}`,
                        orgId,
                        orgName: ORG.name,
                        orgSlug: ORG.slug,
                        projectId,
                        projectName: PROJECT.name,
                        projectSlug: PROJECT.slug,
                        teamId: team.id,
                        teamName: team.name,
                        accepterId: actor.id,
                        accepterName: actor.name,
                    },
                };
            },
            () => {
                const chat = pick(chats);
                const issue =
                    createdIssues.find((candidate) => candidate.id === chat.issueId) ??
                    createdIssues[0];
                const actor = actorFor();
                return {
                    type: NotificationType.MessageReacted,
                    payload: {
                        chatId: chat.id,
                        ...issueBase(issue),
                        actorId: actor.id,
                        actorName: actor.name,
                        emoji: pick(EMOJIS),
                    },
                };
            },
        ];

        for (let index = 0; index < NOTIFICATIONS_PER_USER; index++) {
            const built = builders[index % builders.length]();
            const minutes = index * between(20, 260) + between(2, 40);
            notifications.push({
                userId: human.id,
                type: built.type,
                payload: built.payload,
                readAt: index > 11 && chance(0.7) ? minutesAgo(Math.max(1, minutes - 30)) : null,
                createdAt: minutesAgo(minutes),
            });
        }
    }
    await prisma.notification.createMany({
        data: notifications.map((notification) => ({
            ...notification,
            projectId: seeded_notification_project_id(notification.type, notification.payload),
        })),
    });

    let apiKeyCount = 0;
    for (const human of humans) {
        const keys = [
            { label: "Nocturn CI", lastUsedDaysAgo: 0, revoked: false },
            { label: "Nocturn local", lastUsedDaysAgo: 3, revoked: false },
            { label: "Nocturn old laptop", lastUsedDaysAgo: 61, revoked: true },
        ];
        for (let index = 0; index < keys.length; index++) {
            const key = keys[index];
            const suffix = `${human.id.slice(-4)}${index}`;
            await prisma.apiKey.create({
                data: {
                    userId: human.id,
                    label: key.label,
                    prefix: `mch_live_${suffix.padEnd(8, "x").slice(0, 8)}`,
                    hashedKey: `$2a$10$seededseededseededseeded${suffix}`,
                    lastUsedAt: daysAgo(key.lastUsedDaysAgo),
                    revokedAt: key.revoked ? daysAgo(30) : null,
                    createdAt: daysAgo(between(40, 120)),
                },
            });
            apiKeyCount++;
        }
    }

    for (const post of POSTS) {
        const text = plainText(post.content);
        await prisma.post.create({
            data: {
                kind: post.kind,
                slug: post.slug,
                title: post.title,
                summary: post.summary,
                content: post.content,
                plainText: text,
                author: pick(cast).name,
                tags: [...post.tags],
                version: "version" in post ? post.version : null,
                channel: "channel" in post ? post.channel : null,
                status: post.status,
                readingTime: readingTime(text),
                publishedAt: post.publishedDaysAgo === null ? null : daysAgo(post.publishedDaysAgo),
                createdAt: daysAgo(post.publishedDaysAgo ?? 1),
            },
        });
    }

    console.log(
        JSON.stringify(
            {
                url: `/playground/${ORG.slug}/${PROJECT.slug}`,
                humansAttached: humans.map((human) => human.email),
                castMembers: cast.length,
                teams: TEAMS.length,
                tags: tags.length,
                customColumns: columns.length,
                issueTemplates: TEMPLATES.length,
                workers: workers.length,
                issues: createdIssues.length + paginationIssueRows.length,
                activities: activityRows.length,
                agentSessions: await prisma.agentSession.count({
                    where: { issue: { projectId } },
                }),
                issueChats: await prisma.chat.count({ where: { issue: { projectId } } }),
                projectChats: await prisma.projectChat.count({ where: { projectId } }),
                messageReferences: await prisma.messageReference.count(),
                descriptionReferences: descriptionReferenceCount,
                notifications: notifications.length,
                invitations: INVITES.length,
                productDiffs: diffCount,
                setupQuestions: await prisma.setupQuestion.count({
                    where: { sessionId: setupSession.id },
                }),
                projectSecrets: SECRETS.length,
                apiKeys: apiKeyCount,
                posts: POSTS.length,
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
