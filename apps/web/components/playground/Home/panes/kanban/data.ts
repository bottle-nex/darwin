import { MdIncompleteCircle, MdAutorenew, MdCheckCircle } from "react-icons/md";
import { FaCodePullRequest } from "react-icons/fa6";
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
        icon: MdIncompleteCircle,
        titleBox: "bg-neutral-500/15 text-neutral-200",
    },
    {
        status: KanbanStatus.InProgress,
        title: "In Progress",
        icon: MdAutorenew,
        titleBox: "bg-amber-500/15 text-amber-200",
    },
    {
        status: KanbanStatus.InReview,
        title: "In Review",
        icon: FaCodePullRequest,
        titleBox: "bg-violet-500/15 text-violet-200",
    },
    {
        status: KanbanStatus.Done,
        title: "Done",
        icon: MdCheckCircle,
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

/**
 * The LLM board starts empty — its cards come from the agent flow (and the
 * Custom Kanban bridge), not from placeholder data. Once the To-Do/stage lanes
 * are hydrated from `GET /issues/board`, seed this from the server instead.
 */
export const INITIAL_BOARD: BoardState = {
    [KanbanStatus.Todo]: [],
    [KanbanStatus.InProgress]: [],
    [KanbanStatus.InReview]: [],
    [KanbanStatus.Done]: [],
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
