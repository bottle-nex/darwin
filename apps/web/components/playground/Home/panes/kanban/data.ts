import { CircleDashed, Loader, GitPullRequest, CheckCircle2 } from "lucide-react";
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
        icon: CircleDashed,
        titleBox: "bg-neutral-500/15 text-neutral-200",
    },
    {
        status: KanbanStatus.InProgress,
        title: "In Progress",
        icon: Loader,
        titleBox: "bg-amber-500/15 text-amber-200",
    },
    {
        status: KanbanStatus.InReview,
        title: "In Review",
        icon: GitPullRequest,
        titleBox: "bg-violet-500/15 text-violet-200",
    },
    {
        status: KanbanStatus.Done,
        title: "Done",
        icon: CheckCircle2,
        titleBox: "bg-emerald-500/15 text-emerald-200",
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

const label = (name: string): IssueLabel => LABEL_BY_NAME.get(name)!;

// Dummy issues — the issue/work-item domain isn't modeled in the backend yet,
// so the board ships with realistic placeholder cards (mirrors how the sidebar
// sections use mock data). Swap `INITIAL_BOARD` for real data once the API lands.
const ISSUES: Issue[] = [
    {
        id: "issue-142",
        number: "#142",
        title: "Add dark mode toggle to workspace settings",
        project: "trymatcha-web",
        label: label("feature"),
        priority: "normal",
        agent: "Sonnet 4.6",
        assignees: [{ id: "u1", name: "Piyush", tone: "indigo" }],
        comments: 4,
        status: KanbanStatus.Todo,
        queuePosition: 1,
    },
    {
        id: "issue-138",
        number: "#138",
        title: "Improve onboarding flow copy",
        project: "trymatcha-web",
        label: label("docs"),
        priority: "low",
        agent: "Sonnet 4.6",
        assignees: [{ id: "u2", name: "Abhay", tone: "blue" }],
        comments: 1,
        status: KanbanStatus.Todo,
        queuePosition: 2,
    },
    {
        id: "issue-131",
        number: "#131",
        title: "Refactor auth middleware to share OTP guards",
        project: "trymatcha-api",
        label: label("chore"),
        priority: "high",
        agent: "Sonnet 4.6",
        assignees: [{ id: "u3", name: "Mohit", tone: "purple" }],
        comments: 0,
        status: KanbanStatus.Todo,
        queuePosition: 3,
    },
    {
        id: "issue-150",
        number: "#150",
        title: "Fix memory leak in the board editor",
        project: "trymatcha-web",
        label: label("bug"),
        priority: "urgent",
        agent: "Opus 4.8",
        assignees: [{ id: "u1", name: "Piyush", tone: "indigo" }],
        comments: 7,
        status: KanbanStatus.InProgress,
        step: "Writing patch",
        runner: "prod-worker-1",
    },
    {
        id: "issue-149",
        number: "#149",
        title: "Add keyboard shortcuts panel",
        project: "trymatcha-web",
        label: label("feature"),
        priority: "high",
        agent: "Sonnet 4.6",
        assignees: [{ id: "u2", name: "Abhay", tone: "blue" }],
        comments: 2,
        status: KanbanStatus.InProgress,
        step: "Running tests",
        runner: "staging-worker",
    },
    {
        id: "issue-145",
        number: "#145",
        title: "Implement realtime collaboration cursors",
        project: "trymatcha-web",
        label: label("feature"),
        priority: "high",
        agent: "Opus 4.8",
        assignees: [
            { id: "u1", name: "Piyush", tone: "indigo" },
            { id: "u3", name: "Mohit", tone: "purple" },
        ],
        comments: 12,
        status: KanbanStatus.InReview,
        pr: { number: "PR #234", added: 128, removed: 16 },
    },
    {
        id: "issue-140",
        number: "#140",
        title: "Migrate runners to Next.js 16",
        project: "trymatcha-api",
        label: label("chore"),
        priority: "normal",
        agent: "Sonnet 4.6",
        assignees: [{ id: "u2", name: "Abhay", tone: "blue" }],
        comments: 5,
        status: KanbanStatus.InReview,
        pr: { number: "PR #231", added: 64, removed: 40 },
    },
    {
        id: "issue-128",
        number: "#128",
        title: "Set up CI pipeline for the monorepo",
        project: "trymatcha",
        label: label("chore"),
        priority: "normal",
        agent: "Sonnet 4.6",
        assignees: [{ id: "u3", name: "Mohit", tone: "purple" }],
        comments: 3,
        status: KanbanStatus.Done,
        duration: "4m 12s",
        resolvedAt: "2 days ago",
    },
    {
        id: "issue-120",
        number: "#120",
        title: "Add end-to-end tests for the auth flow",
        project: "trymatcha-api",
        label: label("test"),
        priority: "normal",
        agent: "Opus 4.8",
        assignees: [{ id: "u1", name: "Piyush", tone: "indigo" }],
        comments: 6,
        status: KanbanStatus.Done,
        duration: "7m 03s",
        resolvedAt: "5 days ago",
    },
];

/** Initial board grouped by column, in display order. */
export const INITIAL_BOARD: BoardState = {
    [KanbanStatus.Todo]: ISSUES.filter((i) => i.status === KanbanStatus.Todo),
    [KanbanStatus.InProgress]: ISSUES.filter((i) => i.status === KanbanStatus.InProgress),
    [KanbanStatus.InReview]: ISSUES.filter((i) => i.status === KanbanStatus.InReview),
    [KanbanStatus.Done]: ISSUES.filter((i) => i.status === KanbanStatus.Done),
};

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
