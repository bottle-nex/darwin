"use client";
import { MdHome } from "react-icons/md";
import { HomeTab } from "../homeTabs";
import { RailSurface } from "../../IconRail/railSurface";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import DraftsPane from "./DraftsPane";
import TagsMainPane from "./tags/TagsMainPane";
import InboxMainPane from "./InboxMainPane";
import PaneBreadcrumb from "../../Core/components/PaneBreadcrumb";
import InProgressPane from "./InProgressPane";
import TeamDetailPane from "../../Projects/panes/TeamDetailPane";
import KanbanMainPane from "./kanban/KanbanMainPane";
import ReviewsMainPane from "./ReviewsMainPane";
import MentionsMainPane from "./MentionsMainPane";
import AssignedToMePane from "./AssignedToMePane";

/** Renders the Home surface's active tab. */
export default function HomeDisplay() {
    const tab = usePlaygroundNavStore((s) => s.tabBySurface[RailSurface.Home]);

    switch (tab) {
        case HomeTab.Tags:
            return (
                <div className="flex min-h-0 flex-1 flex-col">
                    <PaneBreadcrumb
                        leading={
                            <MdHome className="size-3.5 shrink-0 text-neutral-400" aria-hidden />
                        }
                        segments={[{ label: "Home" }, { label: "Tags" }]}
                    />
                    <TagsMainPane />
                </div>
            );
        case HomeTab.Mentions:
            return <MentionsMainPane />;
        case HomeTab.Reviews:
            return <ReviewsMainPane />;
        case HomeTab.AssignedToMe:
            return <AssignedToMePane />;
        case HomeTab.InProgress:
            return <InProgressPane />;
        case HomeTab.Drafts:
            return <DraftsPane />;
        case HomeTab.TeamDetail:
            return <TeamDetailPane />;
        case HomeTab.Inbox:
            return <InboxMainPane />;

        case HomeTab.Kanban:
        default:
            return (
                <div className="flex min-h-0 flex-1 flex-col">
                    <PaneBreadcrumb
                        leading={
                            <MdHome className="size-3.5 shrink-0 text-neutral-400" aria-hidden />
                        }
                        segments={[{ label: "Home" }, { label: "Kanban" }]}
                    />
                    <KanbanMainPane />
                </div>
            );
    }
}
