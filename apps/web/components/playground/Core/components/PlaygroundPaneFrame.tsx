"use client";
import { useState, type ReactNode } from "react";
import { PaneSlotsProvider } from "./PlaygroundPaneSlots";
import { useSidebarWidthStore } from "@/store/playground/useSidebarWidthStore";

export const PANE_TOP_BAR_HEIGHT = 42;

export default function PlaygroundPaneFrame({
    lead,
    actions,
    children,
}: {
    lead?: ReactNode;
    actions?: ReactNode;
    children: ReactNode;
}) {
    const sidebarCollapsed = useSidebarWidthStore((s) => s.collapsed);
    const [leadSlot, setLeadSlot] = useState<HTMLDivElement | null>(null);
    const [actionsSlot, setActionsSlot] = useState<HTMLDivElement | null>(null);

    return (
        <div className="flex min-w-0 flex-1 flex-col bg-charcoal">
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
                    {actions}
                </div>
            </div>

            <PaneSlotsProvider value={{ lead: leadSlot, actions: actionsSlot }}>
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
            </PaneSlotsProvider>
        </div>
    );
}
