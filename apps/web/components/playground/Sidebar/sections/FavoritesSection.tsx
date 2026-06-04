"use client";

import Section from "../PlaygroundSidebarSection";
import type { SidebarSectionProps } from "./shared";

export default function PlaygroundSidebarFavoritesSection({ query }: SidebarSectionProps) {
    // Nothing here is searchable, so drop the section entirely while searching.
    if (query.trim()) return null;

    return (
        <div className="mt-3">
            <Section title="Favorites" variant="inline" defaultOpen={false}>
                <div className="px-2 py-1 text-[12px] text-neutral-500">No favorites yet</div>
            </Section>
        </div>
    );
}
