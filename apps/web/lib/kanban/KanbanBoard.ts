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
    type KanbanColumnDef,
    type Priority,
} from "@/types/kanban";

/** Board configuration and lane bookkeeping for the LLM Kanban. */
export class KanbanBoard {
    /** All board statuses in display order. */
    static readonly STATUSES = Object.values(KanbanStatus);

    /**
     * LLM columns that bridge with the Custom Kanban: their cards can be dragged out
     * to a custom column, and a custom card can be dropped in. Every other LLM
     * column stays locked. To bridge another column, add its status here — the
     * board view, the drag logic, and the To Do intake all read from this list.
     */
    static readonly BRIDGE_STATUSES: KanbanStatus[] = [KanbanStatus.Todo];

    /** Column headers in board order. Only `titleBox` is per-status coloured. */
    static readonly COLUMNS: KanbanColumnDef[] = [
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
    static readonly PRIORITY_DOT: Record<Priority, string> = {
        urgent: "bg-rose-500",
        high: "bg-amber-400",
        normal: "bg-neutral-500",
        low: "bg-neutral-600",
    };

    /** Whether a status is a Custom-Kanban bridge column. */
    static isBridgeStatus(status: string): status is KanbanStatus {
        return (KanbanBoard.BRIDGE_STATUSES as string[]).includes(status);
    }

    /** An empty board with one (empty) lane per status — keyed off `STATUSES` so it
     *  always matches `KanbanStatus` and can never drift out of sync with it. */
    static emptyBoard(): BoardState {
        return Object.fromEntries(
            KanbanBoard.STATUSES.map((s) => [s, [] as Issue[]]),
        ) as BoardState;
    }

    /**
     * Apply the active search query and selected tags to every column. An issue
     * matches when its title/number/project contains the query (when set) AND it
     * carries one of the selected tags (when any are selected). Matching is by tag
     * id, not name — names are renameable and collide across projects. Returns a new
     * board; the focus filter (which single column to show) is applied at render.
     */
    static filterBoard(board: BoardState, search: string, tagIds: string[]): BoardState {
        const q = search.trim().toLowerCase();
        const matches = (issue: Issue) => {
            const inText =
                !q ||
                issue.title.toLowerCase().includes(q) ||
                issue.number.toLowerCase().includes(q) ||
                issue.project.toLowerCase().includes(q);
            const inTags = tagIds.length === 0 || issue.tags.some((t) => tagIds.includes(t.id));
            return inText && inTags;
        };
        return Object.fromEntries(
            KanbanBoard.STATUSES.map((s) => [s, board[s].filter(matches)]),
        ) as BoardState;
    }
}
