import type { ReviewState } from "@trydarwin/types";
import {
    type IconType,
    MergeIcon,
    PullRequestClosedIcon,
    PullRequestOpenIcon,
} from "@trydarwin/ui/icons";

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
        text: "text-success",
        surface: "bg-success-surface",
    },
    merged: {
        icon: MergeIcon,
        label: "Merged",
        text: "text-primary",
        surface: "bg-primary/12",
    },
    closed: {
        icon: PullRequestClosedIcon,
        label: "Closed",
        text: "text-danger",
        surface: "bg-danger-surface",
    },
};
