"use client";

import { createContext, createElement, type MouseEvent, type ReactNode, useContext } from "react";

import { useSpaceSelectionStore } from "@/store/space/useSpaceSelectionStore";

const SpaceSelectionOrderContext = createContext<string[] | null>(null);

function renderedSpaceIds(): string[] {
    return Array.from(document.querySelectorAll<HTMLElement>("[data-space-id]")).map(
        (element) => element.dataset.spaceId!,
    );
}

export function useSpaceSelection() {
    const orderedSpaceIds = useContext(SpaceSelectionOrderContext);
    const selectedIds = useSpaceSelectionStore((s) => s.ids);
    const toggle = useSpaceSelectionStore((s) => s.toggle);
    const extendTo = useSpaceSelectionStore((s) => s.extendTo);

    function handleSelectClick(event: MouseEvent, spaceId: string): boolean {
        if (selectedIds.length && !event.shiftKey) {
            event.preventDefault();
            toggle(spaceId);
            return true;
        }
        if (event.shiftKey) {
            event.preventDefault();
            extendTo(spaceId, orderedSpaceIds ?? renderedSpaceIds());
            return true;
        }
        if (event.metaKey || event.ctrlKey) {
            event.preventDefault();
            toggle(spaceId);
            return true;
        }
        return false;
    }

    return {
        selectedIds,
        isSelected: (spaceId: string) => selectedIds.includes(spaceId),
        toggleSelection: (spaceId: string) => toggle(spaceId),
        handleSelectClick,
    };
}

export function SpaceSelectionOrderProvider({
    spaceIds,
    children,
}: {
    spaceIds: string[];
    children: ReactNode;
}) {
    return createElement(SpaceSelectionOrderContext.Provider, { value: spaceIds }, children);
}
