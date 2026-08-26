"use client";
import { type ReactNode, useState } from "react";

import { useSidebarWidthStore } from "@/store/playground/useSidebarWidthStore";

import { PaneSlotsProvider } from "./PlaygroundPaneSlots";

export const PANE_TOP_BAR_HEIGHT = 42;

export default function PlaygroundPaneFrame({
    lead,
    children,
}: {
    lead?: ReactNode;
    children: ReactNode;
}) {
    const sidebarCollapsed = useSidebarWidthStore((s) => s.collapsed);
    const [leadSlot, setLeadSlot] = useState<HTMLDivElement | null>(null);
    const [actionsSlot, setActionsSlot] = useState<HTMLDivElement | null>(null);

    return (
        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border-[1.5px] border-snow/5 bg-charcoal/70">
            <div
                className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-2.5"
                style={{ height: PANE_TOP_BAR_HEIGHT }}
            >
                <div className="flex min-w-0 items-center gap-2">
                    {lead}
                    {!sidebarCollapsed && (
                        <div ref={setLeadSlot} className="flex min-w-0 items-center" />
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <div ref={setActionsSlot} className="flex items-center" />
                </div>
            </div>

            <PaneSlotsProvider value={{ lead: leadSlot, actions: actionsSlot }}>
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
            </PaneSlotsProvider>
        </div>
    );
}
