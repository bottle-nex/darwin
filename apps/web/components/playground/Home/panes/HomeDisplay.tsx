"use client";
import { HomeTab } from "../homeTabs";
import { RailSurface } from "../../IconRail/railSurface";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import DraftsDisplay from "./DraftsDisplay";
import TagsMainPane from "../TagsDisplay/TagsMainPane";
import InboxDisplay from "./InboxDisplay";
import InProgressDisplay from "./InProgressDisplay";
import TeamDetailDisplay from "../../Projects/panes/TeamDetailDisplay";
import GanttPane from "../GanttDisplay/GanttPane";
import ProjectSettingsView from "../SettingsDisplay/ProjectSettingsView";
import KanbanMainPane from "../KanbanDisplay/KanbanMainPane";
import ReviewsDisplay from "./ReviewsDisplay";
import MentionsDisplay from "./MentionsDisplay";
import AssignedToMeDisplay from "./AssignedToMeDisplay";

/** Renders the Home surface's active tab. */
export default function HomeDisplay() {
    const tab = usePlaygroundNavStore((s) => s.tabBySurface[RailSurface.Home]);

    switch (tab) {
        case HomeTab.Tags:
            return (
                <div className="flex min-h-0 flex-1 flex-col">
                    <TagsMainPane />
                </div>
            );
        case HomeTab.Mentions:
            return <MentionsDisplay />;
        case HomeTab.Reviews:
            return <ReviewsDisplay />;
        case HomeTab.AssignedToMe:
            return <AssignedToMeDisplay />;
        case HomeTab.InProgress:
            return <InProgressDisplay />;
        case HomeTab.Drafts:
            return <DraftsDisplay />;
        case HomeTab.TeamDetail:
            return <TeamDetailDisplay />;
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
            return <InboxDisplay />;

        case HomeTab.Kanban:
        default:
            return (
                <div className="flex min-h-0 flex-1 flex-col">
                    <KanbanMainPane />
                </div>
            );
    }
}
