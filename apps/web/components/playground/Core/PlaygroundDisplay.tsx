"use client";
import LogoLoader from "@/components/app/LogoLoader";
import { PLAYGROUND_PANE_SHELL } from "@/components/playground/Core/components/paneBar";
import {
    PaneSlotsProvider,
    usePaneSlots,
} from "@/components/playground/Core/components/PlaygroundPaneSlots";
import GanttDisplay from "@/components/playground/Home/GanttDisplay/GanttDisplay";
import InboxDisplay from "@/components/playground/Home/InboxDisplay/InboxDisplay";
import KanbanDisplay from "@/components/playground/Home/KanbanDisplay/KanbanDisplay";
import MyIssuesDisplay from "@/components/playground/Home/MyIssuesDisplay/MyIssuesDisplay";
import ChatsDisplay from "@/components/playground/Home/panes/ChatsDisplay";
import ApiKeysSettingsSection from "@/components/playground/Home/SettingsDisplay/ApiKeysSettingsSection";
import AppearanceSettingsSection from "@/components/playground/Home/SettingsDisplay/AppearanceSettingsSection";
import SettingsBreadcrumb from "@/components/playground/Home/SettingsDisplay/SettingsBreadcrumb";
import SettingsDisplay from "@/components/playground/Home/SettingsDisplay/SettingsDisplay";
import SettingsPaneShell from "@/components/playground/Home/SettingsDisplay/SettingsPaneShell";
import TagsDisplay from "@/components/playground/Home/TagsDisplay/TagsDisplay";
import { isSettingsTab, PlaygroundTab } from "@/components/playground/playgroundTabs";
import TeamDetailDisplay from "@/components/playground/Team/TeamDisplay";
import { cn } from "@/lib/utils";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";

function TabPane({ tab }: { tab: string }) {
    switch (tab) {
        case PlaygroundTab.Tags:
            return (
                <div className="flex min-h-0 flex-1 flex-col">
                    <TagsDisplay />
                </div>
            );
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
        case PlaygroundTab.SettingsAppearance:
            return (
                <SettingsPaneShell sectionKey={tab}>
                    <AppearanceSettingsSection />
                </SettingsPaneShell>
            );
        case PlaygroundTab.SettingsApiKeys:
            return (
                <SettingsPaneShell sectionKey={tab}>
                    <ApiKeysSettingsSection />
                </SettingsPaneShell>
            );
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

const EMPTY_PANE_SLOTS = { lead: null, actions: null };

function RetainedWorkspacePane({ tab, hidden }: { tab: string; hidden: boolean }) {
    const paneSlots = usePaneSlots();

    return (
        <PaneSlotsProvider value={hidden ? EMPTY_PANE_SLOTS : paneSlots}>
            <TabPane tab={tab} />
        </PaneSlotsProvider>
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
                        <RetainedWorkspacePane tab={lastWorkspaceTab} hidden={inSettings} />
                    </div>
                    {inSettings && (
                        <>
                            <SettingsBreadcrumb />
                            <SettingsPane tab={tab} />
                        </>
                    )}
                </>
            )}
        </main>
    );
}
