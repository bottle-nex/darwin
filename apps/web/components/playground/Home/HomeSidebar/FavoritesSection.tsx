"use client";

import Section from "../../Sidebar/SidebarSection";
import type { SidebarSectionProps } from "../../Sidebar/shared";

export default function PlaygroundSidebarFavoritesSection({ query }: SidebarSectionProps) {
    if (query.trim()) return null;

    return (
        <div className="mt-3">
            <Section title="Favorites" variant="inline" defaultOpen={false}>
                <div className="px-2 py-1 text-[12px] text-neutral-500">No favorites yet</div>
            </Section>
        </div>
    );
}
