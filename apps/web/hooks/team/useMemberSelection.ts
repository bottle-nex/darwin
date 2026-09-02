"use client";

import { createContext, createElement, type MouseEvent, type ReactNode, useContext } from "react";

import { useMemberSelectionStore } from "@/store/team/useMemberSelectionStore";

const MemberSelectionOrderContext = createContext<string[] | null>(null);

function renderedMemberKeys(): string[] {
    return Array.from(document.querySelectorAll<HTMLElement>("[data-member-id]")).map(
        (element) => element.dataset.memberId!,
    );
}

export function useMemberSelection() {
    const orderedMemberKeys = useContext(MemberSelectionOrderContext);
    const selectedIds = useMemberSelectionStore((s) => s.ids);
    const toggle = useMemberSelectionStore((s) => s.toggle);
    const extendTo = useMemberSelectionStore((s) => s.extendTo);

    function handleSelectClick(event: MouseEvent, memberKey: string): boolean {
        if (selectedIds.length && !event.shiftKey) {
            event.preventDefault();
            toggle(memberKey);
            return true;
        }
        if (event.shiftKey) {
            event.preventDefault();
            extendTo(memberKey, orderedMemberKeys ?? renderedMemberKeys());
            return true;
        }
        if (event.metaKey || event.ctrlKey) {
            event.preventDefault();
            toggle(memberKey);
            return true;
        }
        return false;
    }

    return {
        selectedIds,
        isSelected: (memberKey: string) => selectedIds.includes(memberKey),
        toggleSelection: (memberKey: string) => toggle(memberKey),
        handleSelectClick,
    };
}

export function MemberSelectionOrderProvider({
    memberKeys,
    children,
}: {
    memberKeys: string[];
    children: ReactNode;
}) {
    return createElement(MemberSelectionOrderContext.Provider, { value: memberKeys }, children);
}
