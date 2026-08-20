"use client";
import { PaneLeadSlot } from "@/components/playground/Core/components/PlaygroundPaneSlots";
import { PlaygroundTab } from "@/components/playground/playgroundTabs";

const SETTINGS_LABELS: Record<string, string> = {
    [PlaygroundTab.SettingsAppearance]: "Appearance",
    [PlaygroundTab.SettingsApiKeys]: "API keys",
    [PlaygroundTab.SettingsProject]: "General",
    [PlaygroundTab.SettingsTemplates]: "Issue templates",
    [PlaygroundTab.SettingsEnv]: "Environment variables",
};

export default function SettingsBreadcrumb({ tab }: { tab: string }) {
    const label = SETTINGS_LABELS[tab];
    if (!label) return null;

    return (
        <PaneLeadSlot>
            <div className="flex min-w-0 items-center gap-1.5">
                <span className="shrink-0 text-[13px] text-neutral-500">Settings</span>
                <span className="shrink-0 text-neutral-600">/</span>
                <span className="truncate text-[13px] font-medium text-neutral-200">{label}</span>
            </div>
        </PaneLeadSlot>
    );
}
