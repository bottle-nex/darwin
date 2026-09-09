import { ISSUE_LANE_NAME } from "@trydarwin/types";
import {
    CancelledStatusIcon,
    DoneStatusIcon,
    FailedStatusIcon,
    InProgressStatusIcon,
    InReviewStatusIcon,
    OffBoardStatusIcon,
    QueuedStatusIcon,
    TodoStatusIcon,
} from "@trydarwin/ui/icons";

import { type KanbanColumnDef, KanbanStatus, type Priority } from "@/types/kanban";

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

    /**
     * Status glyph colours are literals, not tokens, so a lane reads the same
     * whichever theme is active — the status is a property of the issue, not of
     * the surface it sits on. Every value clears 3:1 against both grounds.
     */
    static readonly COLUMNS: KanbanColumnDef[] = [
        {
            status: KanbanStatus.Todo,
            title: ISSUE_LANE_NAME[KanbanStatus.Todo],
            icon: TodoStatusIcon,
            titleBox: "text-[#8a8f98]",
        },
        {
            status: KanbanStatus.Queued,
            title: ISSUE_LANE_NAME[KanbanStatus.Queued],
            icon: QueuedStatusIcon,
            titleBox: "text-[#7e838d]",
        },
        {
            status: KanbanStatus.InProgress,
            title: ISSUE_LANE_NAME[KanbanStatus.InProgress],
            icon: InProgressStatusIcon,
            titleBox: "text-[#D69E1F]",
        },
        {
            status: KanbanStatus.InReview,
            title: ISSUE_LANE_NAME[KanbanStatus.InReview],
            icon: InReviewStatusIcon,
            titleBox: "text-[#8999FF]",
        },
        {
            status: KanbanStatus.Done,
            title: ISSUE_LANE_NAME[KanbanStatus.Done],
            icon: DoneStatusIcon,
            titleBox: "text-[#34C75C]",
        },
        {
            status: KanbanStatus.Failed,
            title: ISSUE_LANE_NAME[KanbanStatus.Failed],
            icon: FailedStatusIcon,
            titleBox: "text-[#e5484d]",
        },
        {
            status: KanbanStatus.Cancelled,
            title: ISSUE_LANE_NAME[KanbanStatus.Cancelled],
            icon: CancelledStatusIcon,
            titleBox: "text-[#6f747e]",
        },
    ];

    static readonly PRIORITY_DOT: Record<Priority, string> = {
        none: "bg-[#6f747e]",
        urgent: "bg-[#e5484d]",
        high: "bg-[#d69e1f]",
        medium: "bg-[#8a8f98]",
        low: "bg-[#7e838d]",
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
        icon: OffBoardStatusIcon,
        titleBox: "text-[#6f747e]",
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
}
