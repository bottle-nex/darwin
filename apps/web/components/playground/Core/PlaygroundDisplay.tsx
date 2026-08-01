"use client";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { PlaygroundTab } from "@/components/playground/playgroundTabs";
import OverviewDisplay from "@/components/playground/Home/OverviewDisplay/OverviewDisplay";
import KanbanDisplay from "@/components/playground/Home/KanbanDisplay/KanbanDisplay";
import GanttDisplay from "@/components/playground/Home/GanttDisplay/GanttDisplay";
import TagsDisplay from "@/components/playground/Home/TagsDisplay/TagsDisplay";
import ThreadsDisplay from "@/components/playground/Home/panes/ThreadsDisplay";
import ThreadDetailDisplay from "@/components/playground/Home/panes/ThreadDetailDisplay";
import MentionsDisplay from "@/components/playground/Home/panes/MentionsDisplay";
import ReviewsDisplay from "@/components/playground/Home/panes/ReviewsDisplay";
import AssignedToMeDisplay from "@/components/playground/Home/panes/AssignedToMeDisplay";
import InProgressDisplay from "@/components/playground/Home/panes/InProgressDisplay";
import DraftsDisplay from "@/components/playground/Home/panes/DraftsDisplay";
import SettingsDisplay from "@/components/playground/Home/SettingsDisplay/SettingsDisplay";
import TeamDetailDisplay from "@/components/playground/Team/TeamDisplay";
import LogoLoader from "@/components/app/LogoLoader";

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
        case PlaygroundTab.Mentions:
            return <MentionsDisplay />;
        case PlaygroundTab.Reviews:
            return <ReviewsDisplay />;
        case PlaygroundTab.AssignedToMe:
            return <AssignedToMeDisplay />;
        case PlaygroundTab.InProgress:
            return <InProgressDisplay />;
        case PlaygroundTab.Drafts:
            return <DraftsDisplay />;
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
            return <ThreadsDisplay />;
        case PlaygroundTab.ThreadDetail:
            return <ThreadDetailDisplay />;

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
        <main className="relative z-0 flex flex-1 min-w-0 flex-col overflow-hidden rounded-lg ring-1 ring-graphite/90 bg-charcoal">
            {isLoading ? <LogoLoader className="h-full w-full" /> : <TabPane tab={tab} />}
        </main>
    );
}
