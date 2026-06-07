"use client";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { RailSurface } from "../../IconRail/railSurface";
import { HomeTab } from "../homeTabs";
import TeamDetailPane from "../../Projects/panes/TeamDetailPane";
import InboxMainPane from "./InboxMainPane";
import KanbanMainPane from "./KanbanMainPane";
import MentionsMainPane from "./MentionsMainPane";
import ReviewsMainPane from "./ReviewsMainPane";
import AssignedToMePane from "./AssignedToMePane";
import InProgressPane from "./InProgressPane";
import DraftsPane from "./DraftsPane";

/** Renders the Home surface's active tab. */
export default function HomeMainPane() {
    const tab = usePlaygroundNavStore((s) => s.tabBySurface[RailSurface.Home]);

    switch (tab) {
        case HomeTab.Kanban:
            return <KanbanMainPane />;
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
            return <TeamDetailPane surface={RailSurface.Home} />;
        case HomeTab.Inbox:
        default:
            return <InboxMainPane />;
    }
}
