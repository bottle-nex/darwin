import {
    LuCircle,
    LuCircleCheck,
    LuCircleDashed,
    LuCircleDotDashed,
    LuCirclePause,
    LuCircleSlash,
    LuCircleX,
} from "react-icons/lu";
import { RiProgress4Line } from "react-icons/ri";

import {
    type BoardState,
    type Issue,
    type KanbanColumnDef,
    KanbanStatus,
    type Priority,
} from "@/types/kanban";

export type StatusGlyph = Pick<KanbanColumnDef, "icon" | "titleBox">;

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

    /** Column headers in board order. `titleBox`/`cardTint` are per-status coloured. */
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
            titleBox: "text-[#F1BF00]",
        },
        {
            status: KanbanStatus.InReview,
            title: "In Review",
            icon: LuCircleDotDashed,
            titleBox: "text-violet-400",
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
            titleBox: "text-rose-400",
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
        none: "bg-neutral-700",
        urgent: "bg-rose-500",
        high: "bg-amber-400",
        medium: "bg-neutral-500",
        low: "bg-neutral-600",
    };

    private static readonly COLUMN_BY_STATUS = new Map(
        KanbanBoard.COLUMNS.map((column) => [column.status as string, column]),
    );

    static columnFor(status: string | undefined): KanbanColumnDef | undefined {
        return status ? KanbanBoard.COLUMN_BY_STATUS.get(status) : undefined;
    }

    /**
     * Issues parked in a custom column sit outside the LLM lanes, so they have no
     * `COLUMNS` entry. Their glyph lives here rather than in `COLUMNS`, which
     * would add a lane to the board.
     */
    private static readonly OFF_BOARD_GLYPH: StatusGlyph = {
        icon: LuCirclePause,
        titleBox: "text-neutral-500",
    };

    /** The status circle for any issue, on a board lane or parked off it. */
    static glyphFor(status: string | undefined): StatusGlyph {
        const column = KanbanBoard.columnFor(status);
        return column
            ? { icon: column.icon, titleBox: column.titleBox }
            : KanbanBoard.OFF_BOARD_GLYPH;
    }

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

    static filterBoard(board: BoardState, matches: (issueId: string) => boolean): BoardState {
        return Object.fromEntries(
            KanbanBoard.STATUSES.map((s) => [s, board[s].filter((issue) => matches(issue.id))]),
        ) as BoardState;
    }

    /**
     * Splits `COLUMNS` into what the board row should render vs. what collapses into the
     * hidden-columns list: a column stays visible if it has issues, or if it's a bridge status
     * (e.g. Todo) that must stay a droppable target even while empty.
     */
    static partitionColumns(board: BoardState): {
        visible: KanbanColumnDef[];
        hidden: KanbanColumnDef[];
    } {
        const visible: KanbanColumnDef[] = [];
        const hidden: KanbanColumnDef[] = [];
        for (const column of KanbanBoard.COLUMNS) {
            const keepVisible =
                board[column.status].length > 0 || KanbanBoard.isBridgeStatus(column.status);
            (keepVisible ? visible : hidden).push(column);
        }
        return { visible, hidden };
    }
}
