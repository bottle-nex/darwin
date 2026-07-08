import {
    LuCircle,
    LuCircleDashed,
    LuCircleDotDashed,
    LuCircleCheck,
    LuCircleX,
    LuCircleSlash,
} from "react-icons/lu";
import { RiProgress4Line } from "react-icons/ri";
import {
    KanbanStatus,
    type BoardState,
    type Issue,
    type IssueLabel,
    type KanbanColumnDef,
    type Priority,
} from "./types";

/** All board statuses in display order. */
export const STATUSES = Object.values(KanbanStatus);

/**
 * LLM columns that bridge with the Custom Kanban: their cards can be dragged out
 * to a custom column, and a custom card can be dropped in. Every other LLM
 * column stays locked. To bridge another column, add its status here — the
 * board view, the drag logic, and the To Do intake all read from this list.
 */
export const BRIDGE_STATUSES: KanbanStatus[] = [KanbanStatus.Todo];

/** Whether a status is a Custom-Kanban bridge column. */
export function isBridgeStatus(status: string): status is KanbanStatus {
    return (BRIDGE_STATUSES as string[]).includes(status);
}

/** Column headers in board order. Only `titleBox` is per-status coloured. */
export const COLUMNS: KanbanColumnDef[] = [
    {
        status: KanbanStatus.Todo,
        title: "To Do",
        icon: LuCircle,
        titleBox: "text-neutral-100",
    },
    {
        status: KanbanStatus.Queued,
        title: "Queued",
        icon: LuCircleDashed,
        titleBox: "text-sky-300",
    },
    {
        status: KanbanStatus.InProgress,
        title: "In Progress",
        icon: RiProgress4Line,
        titleBox: "text-amber-300",
    },
    {
        status: KanbanStatus.InReview,
        title: "In Review",
        icon: LuCircleDotDashed,
        titleBox: "text-violet-300",
    },
    {
        status: KanbanStatus.Done,
        title: "Done",
        icon: LuCircleCheck,
        titleBox: "text-emerald-300",
    },
    {
        status: KanbanStatus.Failed,
        title: "Failed",
        icon: LuCircleX,
        titleBox: "text-rose-300",
    },
    {
        status: KanbanStatus.Cancelled,
        title: "Cancelled",
        icon: LuCircleSlash,
        titleBox: "text-neutral-300",
    },
];

/** Dark-themed dot colour per priority. */
export const PRIORITY_DOT: Record<Priority, string> = {
    urgent: "bg-rose-500",
    high: "bg-amber-400",
    normal: "bg-neutral-500",
    low: "bg-neutral-600",
};

/** Every label that can be applied to an issue and filtered on. */
export const ALL_LABELS: IssueLabel[] = [
    { name: "feature", className: "bg-indigo-500/15 text-indigo-300" },
    { name: "bug", className: "bg-rose-500/15 text-rose-300" },
    { name: "ui", className: "bg-pink-500/15 text-pink-300" },
    { name: "chore", className: "bg-neutral-500/15 text-neutral-300" },
    { name: "docs", className: "bg-sky-500/15 text-sky-300" },
    { name: "test", className: "bg-emerald-500/15 text-emerald-300" },
    { name: "enhancement", className: "bg-teal-500/15 text-teal-300" },
    { name: "performance", className: "bg-amber-500/15 text-amber-300" },
    { name: "security", className: "bg-red-500/15 text-red-300" },
    { name: "refactor", className: "bg-violet-500/15 text-violet-300" },
    { name: "design", className: "bg-fuchsia-500/15 text-fuchsia-300" },
];

const LABEL_BY_NAME = new Map(ALL_LABELS.map((l) => [l.name, l]));

/** Look up a label's style by name (used for selected-label chips). */
export function getLabel(name: string): IssueLabel | undefined {
    return LABEL_BY_NAME.get(name);
}

/** An empty board with one (empty) lane per status — keyed off `STATUSES` so it
 *  always matches `KanbanStatus` and can never drift out of sync with it. */
export function emptyBoard(): BoardState {
    return Object.fromEntries(STATUSES.map((s) => [s, [] as Issue[]])) as BoardState;
}

/** Style lookup helper for seeding dummy issues with real label colours. */
const label = (name: string): IssueLabel => LABEL_BY_NAME.get(name)!;

/**
 * Placeholder issues for local development and demos. The LLM board will
 * eventually hydrate from `GET /issues/board` (the agent flow + Custom Kanban
 * bridge) — until then, `seedBoard()` groups these dummy issues into lanes.
 */
const SEED_ISSUES: Issue[] = [
    // To Do — filed, waiting in the agent's pickup queue.
    {
        id: "seed-todo-1",
        number: "MTC-204",
        title: "Add rate limiting to the OTP request endpoint",
        project: "trymatcha/server",
        label: label("security"),
        priority: "urgent",
        assignees: [{ id: "u-maya", name: "Maya", tone: "purple" }],
        comments: 2,
        status: KanbanStatus.Todo,
        queuePosition: 1,
        agent: "Opus 4.8",
    },
    {
        id: "seed-todo-2",
        number: "MTC-207",
        title: "Document the org → project → team role hierarchy",
        project: "trymatcha/docs",
        label: label("docs"),
        priority: "low",
        assignees: [{ id: "u-rishi", name: "Rishi", tone: "blue" }],
        comments: 0,
        status: KanbanStatus.Todo,
        queuePosition: 2,
    },
    {
        id: "seed-todo-3",
        number: "MTC-211",
        title: "Empty state for the board when no issues are filed",
        project: "trymatcha/web",
        label: label("ui"),
        priority: "normal",
        assignees: [{ id: "u-ava", name: "Ava", tone: "indigo" }],
        comments: 1,
        status: KanbanStatus.Todo,
        queuePosition: 3,
    },
    {
        id: "seed-todo-4",
        number: "MTC-214",
        title: "Validate redirect URLs against an allow-list",
        project: "trymatcha/server",
        label: label("security"),
        priority: "high",
        assignees: [{ id: "u-sam", name: "Sam", tone: "dark" }],
        comments: 0,
        status: KanbanStatus.Todo,
        queuePosition: 4,
    },

    // Queued — claimed, waiting for a runner.
    {
        id: "seed-queued-1",
        number: "MTC-198",
        title: "Migrate Kanban board state to Zustand store",
        project: "trymatcha/web",
        label: label("refactor"),
        priority: "normal",
        assignees: [{ id: "u-leo", name: "Leo", tone: "emerald" }],
        comments: 4,
        status: KanbanStatus.Queued,
        agent: "Sonnet 4.6",
    },
    {
        id: "seed-queued-2",
        number: "MTC-201",
        title: "Add Redis connection retry with backoff",
        project: "trymatcha/server",
        label: label("enhancement"),
        priority: "high",
        assignees: [{ id: "u-rishi", name: "Rishi", tone: "blue" }],
        comments: 2,
        status: KanbanStatus.Queued,
        agent: "Opus 4.8",
    },
    {
        id: "seed-queued-3",
        number: "MTC-205",
        title: "Seed script for demo orgs and projects",
        project: "trymatcha/database",
        label: label("chore"),
        priority: "low",
        assignees: [{ id: "u-ava", name: "Ava", tone: "indigo" }],
        comments: 0,
        status: KanbanStatus.Queued,
        agent: "Sonnet 4.6",
    },
    {
        id: "seed-queued-4",
        number: "MTC-209",
        title: "Tighten CORS config for the production web origin",
        project: "trymatcha/server",
        label: label("security"),
        priority: "normal",
        assignees: [{ id: "u-maya", name: "Maya", tone: "purple" }],
        comments: 1,
        status: KanbanStatus.Queued,
    },

    // In Progress — an agent is actively working it on a runner.
    {
        id: "seed-inprogress-1",
        number: "MTC-128",
        title: "Fix flaky auth redirect on email-OTP verify",
        project: "trymatcha/web",
        label: label("bug"),
        priority: "high",
        agent: "Opus 4.8",
        assignees: [{ id: "u-maya", name: "Maya", tone: "purple" }],
        comments: 3,
        status: KanbanStatus.InProgress,
        step: "Running test suite on runner",
        runner: "runner-eph-7f2a",
    },
    {
        id: "seed-inprogress-2",
        number: "MTC-132",
        title: "Paginate the issues board API response",
        project: "trymatcha/server",
        label: label("performance"),
        priority: "normal",
        agent: "Sonnet 4.6",
        assignees: [{ id: "u-leo", name: "Leo", tone: "emerald" }],
        comments: 2,
        status: KanbanStatus.InProgress,
        step: "Editing controller.board.ts",
        runner: "runner-eph-3c91",
    },
    {
        id: "seed-inprogress-3",
        number: "MTC-140",
        title: "Add optimistic UI for card drag between columns",
        project: "trymatcha/web",
        label: label("enhancement"),
        priority: "normal",
        agent: "Opus 4.8",
        assignees: [{ id: "u-ava", name: "Ava", tone: "indigo" }],
        comments: 5,
        status: KanbanStatus.InProgress,
        step: "Cloning repo into runner",
        runner: "runner-eph-9d04",
    },

    // In Review — a PR is open, awaiting human review.
    {
        id: "seed-inreview-1",
        number: "MTC-115",
        title: "Cache Prisma client on globalThis to survive HMR",
        project: "trymatcha/database",
        label: label("performance"),
        priority: "normal",
        agent: "Opus 4.8",
        assignees: [{ id: "u-leo", name: "Leo", tone: "emerald" }],
        comments: 6,
        status: KanbanStatus.InReview,
        pr: { number: "#342", added: 48, removed: 12 },
    },
    {
        id: "seed-inreview-2",
        number: "MTC-118",
        title: "Lock OTP after max verify attempts",
        project: "trymatcha/server",
        label: label("security"),
        priority: "high",
        agent: "Opus 4.8",
        assignees: [{ id: "u-rishi", name: "Rishi", tone: "blue" }],
        comments: 3,
        status: KanbanStatus.InReview,
        pr: { number: "#345", added: 96, removed: 7 },
    },
    {
        id: "seed-inreview-3",
        number: "MTC-121",
        title: "Skeleton loaders for the dashboard panes",
        project: "trymatcha/web",
        label: label("ui"),
        priority: "low",
        agent: "Sonnet 4.6",
        assignees: [{ id: "u-ava", name: "Ava", tone: "indigo" }],
        comments: 1,
        status: KanbanStatus.InReview,
        pr: { number: "#349", added: 210, removed: 34 },
    },

    // Done — merged and resolved.
    {
        id: "seed-done-1",
        number: "MTC-091",
        title: "Wire Resend email delivery into OTP flow",
        project: "trymatcha/server",
        label: label("feature"),
        priority: "normal",
        assignees: [{ id: "u-rishi", name: "Rishi", tone: "blue" }],
        comments: 5,
        status: KanbanStatus.Done,
        duration: "4m 12s",
        resolvedAt: "2h ago",
    },
    {
        id: "seed-done-2",
        number: "MTC-088",
        title: "Add pg connection pool adapter to Prisma client",
        project: "trymatcha/database",
        label: label("enhancement"),
        priority: "normal",
        assignees: [{ id: "u-leo", name: "Leo", tone: "emerald" }],
        comments: 2,
        status: KanbanStatus.Done,
        duration: "6m 03s",
        resolvedAt: "5h ago",
    },
    {
        id: "seed-done-3",
        number: "MTC-082",
        title: "Set up shared ESLint + Prettier configs",
        project: "trymatcha/config",
        label: label("chore"),
        priority: "low",
        assignees: [{ id: "u-sam", name: "Sam", tone: "dark" }],
        comments: 0,
        status: KanbanStatus.Done,
        duration: "2m 41s",
        resolvedAt: "yesterday",
    },

    // Failed — the run errored out before opening a PR.
    {
        id: "seed-failed-1",
        number: "MTC-073",
        title: "Upgrade to Tailwind v4 and drop the config file",
        project: "trymatcha/web",
        label: label("refactor"),
        priority: "normal",
        agent: "Sonnet 4.6",
        assignees: [{ id: "u-ava", name: "Ava", tone: "indigo" }],
        comments: 4,
        status: KanbanStatus.Failed,
        error: "Build failed: PostCSS plugin error",
    },
    {
        id: "seed-failed-2",
        number: "MTC-069",
        title: "Add e2e test for the OTP request → verify flow",
        project: "trymatcha/server",
        label: label("test"),
        priority: "high",
        agent: "Opus 4.8",
        assignees: [{ id: "u-maya", name: "Maya", tone: "purple" }],
        comments: 2,
        status: KanbanStatus.Failed,
        error: "No test runner configured",
    },
    {
        id: "seed-failed-3",
        number: "MTC-061",
        title: "Generate Prisma client in CI before typecheck",
        project: "trymatcha/database",
        label: label("chore"),
        priority: "normal",
        assignees: [{ id: "u-sam", name: "Sam", tone: "dark" }],
        comments: 1,
        status: KanbanStatus.Failed,
        error: "Runner timed out after 10m",
    },

    // Cancelled — pulled by a human before the agent finished.
    {
        id: "seed-cancelled-1",
        number: "MTC-058",
        title: "Switch session tokens from HS256 to RS256",
        project: "trymatcha/server",
        label: label("security"),
        priority: "low",
        assignees: [{ id: "u-rishi", name: "Rishi", tone: "blue" }],
        comments: 3,
        status: KanbanStatus.Cancelled,
        resolvedAt: "2d ago",
    },
    {
        id: "seed-cancelled-2",
        number: "MTC-052",
        title: "Replace Lenis smooth scroll with native",
        project: "trymatcha/web",
        label: label("refactor"),
        priority: "low",
        assignees: [{ id: "u-ava", name: "Ava", tone: "indigo" }],
        comments: 1,
        status: KanbanStatus.Cancelled,
        resolvedAt: "3d ago",
    },
];

/** Group the seed issues into board lanes, keyed by status. */
export function seedBoard(): BoardState {
    const board = emptyBoard();
    for (const issue of SEED_ISSUES) {
        board[issue.status].push(issue);
    }
    return board;
}

export const INITIAL_BOARD: BoardState = seedBoard();

/**
 * Apply the active search query and selected labels to every column. An issue
 * matches when its title/number/project contains the query (when set) AND it
 * carries one of the selected labels (when any are selected). Returns a new
 * board; the focus filter (which single column to show) is applied at render.
 */
export function filterBoard(board: BoardState, search: string, labels: string[]): BoardState {
    const q = search.trim().toLowerCase();
    const matches = (issue: Issue) => {
        const inText =
            !q ||
            issue.title.toLowerCase().includes(q) ||
            issue.number.toLowerCase().includes(q) ||
            issue.project.toLowerCase().includes(q);
        const inLabels =
            labels.length === 0 || (issue.label ? labels.includes(issue.label.name) : false);
        return inText && inLabels;
    };
    return Object.fromEntries(STATUSES.map((s) => [s, board[s].filter(matches)])) as BoardState;
}
