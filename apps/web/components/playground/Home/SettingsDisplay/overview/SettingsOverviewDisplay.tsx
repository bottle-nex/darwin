"use client";
import { useState } from "react";

import {
    filterSettingsItems,
    type SettingsItem,
} from "@/components/playground/Sidebar/settingsItems";
import { useActiveProject } from "@/hooks/useActiveProject";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";

import OverviewGroup from "./OverviewGroup";
import OverviewSearchField from "./OverviewSearchField";

export default function SettingsOverviewDisplay() {
    const activeProject = useActiveProject();
    const setTab = usePlaygroundNavStore((s) => s.setTab);
    const [query, setQuery] = useState("");

    const hasProject = Boolean(activeProject);
    const { accountItems, projectItems, topMatch } = filterSettingsItems(query, hasProject);
    const searching = query.trim().length > 0;
    const nothingMatches = searching && accountItems.length === 0 && projectItems.length === 0;

    function openItem(item: SettingsItem) {
        setTab(item.tab);
    }

    return (
        <div className="flex flex-col gap-8 pb-16">
            <header className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
                <h1 className="text-xl leading-tight font-semibold tracking-tight text-snow">
                    Settings
                </h1>
                <OverviewSearchField
                    value={query}
                    onChange={setQuery}
                    onSubmit={() => topMatch && openItem(topMatch)}
                />
            </header>

            {nothingMatches ? (
                <p className="text-[13px] text-snow/40">
                    No settings match &ldquo;{query.trim()}&rdquo;.
                </p>
            ) : (
                <>
                    {accountItems.length > 0 && (
                        <OverviewGroup
                            title="Account"
                            items={accountItems}
                            topMatchTab={searching ? topMatch?.tab : undefined}
                            onOpen={openItem}
                        />
                    )}
                    {projectItems.length > 0 && (
                        <OverviewGroup
                            title="Project"
                            items={projectItems}
                            topMatchTab={searching ? topMatch?.tab : undefined}
                            onOpen={openItem}
                        />
                    )}
                    {!hasProject && !searching && (
                        <p className="text-[12px] text-snow/40">
                            Open a project to manage its settings.
                        </p>
                    )}
                </>
            )}
        </div>
    );
}
