"use client";
import { HomeTab } from "../homeTabs";
import { RailSurface } from "../../IconRail/railSurface";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import DraftsPane from "./DraftsPane";
import InboxMainPane from "./InboxMainPane";
import InProgressPane from "./InProgressPane";
import TeamDetailPane from "../../Projects/panes/TeamDetailPane";
import GanttPane from "../../Projects/panes/GanttPane";
import ProjectSettingsView from "../../Projects/panes/ProjectSettingsView";
import KanbanMainPane from "./kanban/KanbanMainPane";
import ReviewsMainPane from "./ReviewsMainPane";
import MentionsMainPane from "./MentionsMainPane";
import AssignedToMePane from "./AssignedToMePane";

/** Renders the Home surface's active tab. */
export default function HomeDisplay() {
    const tab = usePlaygroundNavStore((s) => s.tabBySurface[RailSurface.Home]);

    switch (tab) {
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
        case HomeTab.Gantt:
            return (
                <div className="flex min-h-0 flex-1 flex-col">
                    <GanttPane />
                </div>
            );
        case HomeTab.SettingsProject:
            return <ProjectSettingsView section="project" />;
        case HomeTab.SettingsEnv:
            return <ProjectSettingsView section="env" />;
        case HomeTab.Inbox:
            return <InboxMainPane />;

        case HomeTab.Kanban:
        default:
            return (
                <div className="flex min-h-0 flex-1 flex-col">
                    <KanbanMainPane />
                </div>
            );
    }
}
