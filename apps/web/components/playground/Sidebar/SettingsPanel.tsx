"use client";
import { SettingsOverviewIcon } from "@trydarwin/ui/icons";

import { useActiveProject } from "@/hooks/useActiveProject";
import { cn } from "@/lib/utils";

import { PlaygroundTab } from "../playgroundTabs";
import { filterSettingsItems, type SettingsItem } from "./settingsItems";
import type { SidebarSectionProps } from "./shared";
import Row from "./SidebarRow";
import Section from "./SidebarSection";

export default function PlaygroundSidebarSettingsPanel({
    selectedRowId,
    onSelect,
    query,
}: SidebarSectionProps & { query: string }) {
    const activeProject = useActiveProject();
    const { accountItems, projectItems, topMatch } = filterSettingsItems(
        query,
        Boolean(activeProject),
    );

    function renderItem(item: SettingsItem) {
        return (
            <Row
                key={item.tab}
                className={cn(
                    topMatch?.tab === item.tab &&
                        selectedRowId !== item.tab &&
                        "bg-active text-neutral-100",
                )}
                leading={{ kind: "icon", icon: item.icon }}
                label={item.label}
                active={selectedRowId === item.tab}
                onClick={() => onSelect(item.tab)}
            />
        );
    }

    return (
        <>
            {!query.trim() && (
                <Row
                    className="mt-2 -mb-1.5"
                    leading={{ kind: "icon", icon: SettingsOverviewIcon }}
                    label="Overview"
                    active={selectedRowId === PlaygroundTab.SettingsOverview}
                    onClick={() => onSelect(PlaygroundTab.SettingsOverview)}
                />
            )}

            {accountItems.length > 0 && (
                <Section title="Account">{accountItems.map(renderItem)}</Section>
            )}

            {projectItems.length > 0 && (
                <Section title="Project">{projectItems.map(renderItem)}</Section>
            )}
        </>
    );
}
