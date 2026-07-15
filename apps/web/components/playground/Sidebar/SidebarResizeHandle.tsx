"use client";
import { useRef } from "react";
import { useSidebarWidthStore } from "@/store/playground/useSidebarWidthStore";

export default function SidebarResizeHandle() {
    const setWidth = useSidebarWidthStore((s) => s.setWidth);
    const drag = useRef<{ startX: number; startWidth: number } | null>(null);

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        drag.current = {
            startX: e.clientX,
            startWidth: useSidebarWidthStore.getState().width,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!drag.current) return;
        setWidth(drag.current.startWidth + (e.clientX - drag.current.startX));
    };

    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        drag.current = null;
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
