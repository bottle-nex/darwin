"use client";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { PlaygroundTab } from "@/components/playground/playgroundTabs";
import { cn } from "@/lib/utils";
import OverviewDisplay from "@/components/playground/Home/OverviewDisplay/OverviewDisplay";
import KanbanDisplay from "@/components/playground/Home/KanbanDisplay/KanbanDisplay";
import GanttDisplay from "@/components/playground/Home/GanttDisplay/GanttDisplay";
import TagsDisplay from "@/components/playground/Home/TagsDisplay/TagsDisplay";
import ChatsDisplay from "@/components/playground/Home/panes/ChatsDisplay";
import ReviewsDisplay from "@/components/playground/Home/panes/ReviewsDisplay";
import MyIssuesDisplay from "@/components/playground/Home/MyIssuesDisplay/MyIssuesDisplay";
import InboxDisplay from "@/components/playground/Home/InboxDisplay/InboxDisplay";
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
        case PlaygroundTab.Chats:
            return <ChatsDisplay />;
        case PlaygroundTab.Inbox:
            return <InboxDisplay />;

        case PlaygroundTab.Kanban:
        default:
            return (
                <div className="flex min-h-0 flex-1 flex-col">
                    <KanbanDisplay />
                </div>
            );
    }
}

function SettingsPane({ tab }: { tab: string }) {
    switch (tab) {
        case PlaygroundTab.SettingsProject:
            return <SettingsDisplay section="project" />;
        case PlaygroundTab.SettingsTemplates:
            return <SettingsDisplay section="templates" />;
        case PlaygroundTab.SettingsEnv:
            return <SettingsDisplay section="env" />;
        default:
            return null;
    }
}

function isSettingsTab(tab: string) {
    return (
        tab === PlaygroundTab.SettingsProject ||
        tab === PlaygroundTab.SettingsTemplates ||
        tab === PlaygroundTab.SettingsEnv
    );
}

export default function PlaygroundDisplay({ isLoading }: { isLoading?: boolean }) {
    const tab = usePlaygroundNavStore((s) => s.tab);
    const lastWorkspaceTab = usePlaygroundNavStore((s) => s.lastWorkspaceTab);
    const inSettings = isSettingsTab(tab);

    return (
        <main className={PLAYGROUND_PANE_SHELL}>
            {isLoading ? (
                <LogoLoader className="h-full w-full" />
            ) : (
                <>
                    <div
                        aria-hidden={inSettings}
                        className={cn("flex min-h-0 flex-1 flex-col", inSettings && "hidden")}
                    >
                        <TabPane tab={lastWorkspaceTab} />
                    </div>
                    {inSettings && <SettingsPane tab={tab} />}
                </>
            )}
        </main>
    );
}
