"use client";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { PlaygroundTab } from "@/components/playground/playgroundTabs";
import OverviewDisplay from "@/components/playground/Home/OverviewDisplay/OverviewDisplay";
import KanbanDisplay from "@/components/playground/Home/KanbanDisplay/KanbanDisplay";
import GanttDisplay from "@/components/playground/Home/GanttDisplay/GanttDisplay";
import TagsDisplay from "@/components/playground/Home/TagsDisplay/TagsDisplay";
import ChatsDisplay from "@/components/playground/Home/panes/ChatsDisplay";
import ReviewsDisplay from "@/components/playground/Home/panes/ReviewsDisplay";
import MyIssuesDisplay from "@/components/playground/Home/MyIssuesDisplay/MyIssuesDisplay";
import SettingsDisplay from "@/components/playground/Home/SettingsDisplay/SettingsDisplay";
import TeamDetailDisplay from "@/components/playground/Team/TeamDisplay";
import LogoLoader from "@/components/app/LogoLoader";
import { PLAYGROUND_PANE_SHELL } from "@/components/playground/Core/components/paneBar";

function TabPane({ tab }: { tab: string }) {
    switch (tab) {
        case PlaygroundTab.Overview:
            return (
                <div className="flex min-h-0 flex-1 flex-col">
                    <OverviewDisplay />
                </div>
            );
        case PlaygroundTab.Tags:
            return (
                <div className="flex min-h-0 flex-1 flex-col">
                    <TagsDisplay />
                </div>
            );
        case PlaygroundTab.Reviews:
            return <ReviewsDisplay />;
        case PlaygroundTab.AssignedToMe:
            return <MyIssuesDisplay />;
        case PlaygroundTab.TeamDetail:
            return <TeamDetailDisplay />;
        case PlaygroundTab.Gantt:
            return (
                <div className="flex min-h-0 flex-1 flex-col">
                    <GanttDisplay />
                </div>
            );
        case PlaygroundTab.SettingsProject:
            return <SettingsDisplay section="project" />;
        case PlaygroundTab.SettingsTemplates:
            return <SettingsDisplay section="templates" />;
        case PlaygroundTab.SettingsEnv:
            return <SettingsDisplay section="env" />;
        case PlaygroundTab.Chats:
            return <ChatsDisplay />;

        case PlaygroundTab.Kanban:
        default:
            return (
                <div className="flex min-h-0 flex-1 flex-col">
                    <KanbanDisplay />
                </div>
            );
    }
}

export default function PlaygroundDisplay({ isLoading }: { isLoading?: boolean }) {
    const tab = usePlaygroundNavStore((s) => s.tab);

    return (
        <main className={PLAYGROUND_PANE_SHELL}>
            {isLoading ? <LogoLoader className="h-full w-full" /> : <TabPane tab={tab} />}
        </main>
    );
}
