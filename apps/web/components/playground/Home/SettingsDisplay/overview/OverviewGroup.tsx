"use client";
import type { SettingsItem } from "@/components/playground/Sidebar/settingsItems";

import OverviewTile from "./OverviewTile";

export default function OverviewGroup({
    title,
    items,
    topMatchTab,
    onOpen,
}: {
    title: string;
    items: SettingsItem[];
    topMatchTab?: string;
    onOpen: (item: SettingsItem) => void;
}) {
    return (
        <section className="flex flex-col gap-2 mt-2">
            <h2 className="text-[11px] font-medium tracking-wider text-overlay/35 uppercase">
                {title}
            </h2>
            <div className="-mx-3 grid gap-x-3 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                    <OverviewTile
                        key={item.tab}
                        item={item}
                        isTopMatch={topMatchTab === item.tab}
                        onOpen={onOpen}
                    />
                ))}
            </div>
        </section>
    );
}
