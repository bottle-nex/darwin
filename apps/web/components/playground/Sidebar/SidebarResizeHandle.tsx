"use client";
import { useRef } from "react";
import {
    SIDEBAR_COLLAPSE_THRESHOLD,
    useSidebarWidthStore,
} from "@/store/playground/useSidebarWidthStore";

export default function SidebarResizeHandle() {
    const setWidth = useSidebarWidthStore((s) => s.setWidth);
    const collapse = useSidebarWidthStore((s) => s.collapse);
    const setDragging = useSidebarWidthStore((s) => s.setDragging);
    const drag = useRef<{ startX: number; startWidth: number } | null>(null);

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        const { width, collapsed } = useSidebarWidthStore.getState();
        drag.current = { startX: e.clientX, startWidth: collapsed ? 0 : width };
        setDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!drag.current) return;
        const next = drag.current.startWidth + (e.clientX - drag.current.startX);
        if (next < SIDEBAR_COLLAPSE_THRESHOLD) {
            drag.current = null;
            setDragging(false);
            collapse();
            return;
        }
        setWidth(next);
    };

    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        drag.current = null;
        setDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    return (
        <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="group relative -mx-1 flex w-2 shrink-0 cursor-col-resize items-center justify-center"
        >
            <span className="h-[90%] w-1 bg-transparent transition-colors group-hover:bg-white/20" />
        </div>
    );
}
