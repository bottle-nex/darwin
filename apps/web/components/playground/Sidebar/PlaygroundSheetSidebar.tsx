"use client";
import { useEffect } from "react";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { useSidebarWidthStore } from "@/store/playground/useSidebarWidthStore";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import SidebarContent from "./SidebarContent";

export default function PlaygroundSheetSidebar() {
    const { width, collapsed, sheetOpen, openSheet, closeSheet } = useSidebarWidthStore();
    const tab = usePlaygroundNavStore((s) => s.tab);
    const selectedTeam = usePlaygroundNavStore((s) => s.selectedTeam);
    const selectedThread = usePlaygroundNavStore((s) => s.selectedThread);

    useEffect(() => {
        if (sheetOpen) closeSheet();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, selectedTeam, selectedThread]);

    return (
        <>
            {collapsed && !sheetOpen && (
                <div
                    aria-hidden
                    onMouseEnter={openSheet}
                    className="fixed top-11 bottom-0 left-0 z-40 w-3"
                />
            )}

            <Sheet open={sheetOpen} onOpenChange={(open) => (open ? openSheet() : closeSheet())}>
                <SheetContent
                    side="left"
                    showCloseButton={false}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onMouseLeave={closeSheet}
                    style={{ width: width + 12 }}
                    className="top-3 bottom-3 left-0 h-auto max-w-[calc(100%-1.5rem)] gap-0 border-0 bg-transparent p-0 pl-3 text-neutral-100 shadow-none will-change-transform ease-[cubic-bezier(0.32,0.72,0,1)] data-[state=closed]:duration-200 data-[state=open]:duration-300"
                >
                    <SheetTitle className="sr-only">Sidebar</SheetTitle>
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/5 bg-charcoal py-2 shadow-xl">
                        <SidebarContent />
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
