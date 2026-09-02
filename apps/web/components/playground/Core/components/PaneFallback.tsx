"use client";
import type { ReactNode } from "react";

import LogoLoader from "@/components/app/LogoLoader";

import { PLAYGROUND_PANE_SHELL } from "./paneBar";
import PlaygroundBreadcrumb from "./PlaygroundBreadcrumb";
import { PaneLeadSlot } from "./PlaygroundPaneSlots";

/**
 * What a pane shows before it knows what it is showing.
 *
 * The breadcrumb still renders so the frame does not jump once the data lands. Children are
 * the "we looked and it is not there" message; without them this is the loading state.
 */
export default function PaneFallback({ children }: { children?: ReactNode }) {
    return (
        <main className={PLAYGROUND_PANE_SHELL}>
            <PaneLeadSlot>
                <PlaygroundBreadcrumb />
            </PaneLeadSlot>
            {children ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-y-3">
                    {children}
                </div>
            ) : (
                <LogoLoader className="h-full w-full text-snow" />
            )}
        </main>
    );
}
