import type { ReviewState } from "@trymatcha/types";
import {
    type IconType,
    MergeIcon,
    PullRequestClosedIcon,
    PullRequestOpenIcon,
} from "@trymatcha/ui/icons";

/**
 * How a pull request's state is drawn app-wide. Kanban status colours are a
 * different language — green there means "done", which is not what an open
 * pull request is — so PR surfaces read these instead.
 */
export const PULL_REQUEST_STATE: Record<
    ReviewState,
    { icon: IconType; label: string; text: string; surface: string }
> = {
    open: {
        icon: PullRequestOpenIcon,
        label: "Open",
        text: "text-green-400",
        surface: "bg-green-500/12",
    },
    merged: {
        icon: MergeIcon,
        label: "Merged",
        text: "text-violet-400",
        surface: "bg-violet-500/12",
    },
    closed: {
        icon: PullRequestClosedIcon,
        label: "Closed",
        text: "text-rose-400",
        surface: "bg-rose-500/12",
    },
};
