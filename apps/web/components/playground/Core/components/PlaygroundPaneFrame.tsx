"use client";
import {
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type ReactNode,
} from "react";
import PaneFrameShape, { PANE_FRAME_NOTCH_HEIGHT, PANE_FRAME_SLANT_WIDTH } from "./PaneFrameShape";
import { PaneSlotsProvider } from "./PlaygroundPaneSlots";
import { useSidebarWidthStore } from "@/store/playground/useSidebarWidthStore";

const ACTIONS_INSET_RIGHT = 10;
const ACTIONS_NOTCH_GUTTER = 0;
const LEAD_INSET_LEFT = 10;
const PANE_ACTIONS_GAP = 8;

function useMeasuredWidth<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });

    useLayoutEffect(() => {
        const node = ref.current;
        if (!node) return;

        const measure = () => {
            const box = node.getBoundingClientRect();
            setSize({ width: box.width, height: box.height });
        };

        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return [ref, size] as const;
}

export default function PlaygroundPaneFrame({
    lead,
    actions,
    children,
}: {
    lead?: ReactNode;
    actions?: ReactNode;
    children: ReactNode;
}) {
    const [frameRef, frame] = useMeasuredWidth<HTMLDivElement>();
    const [actionsRef, actionsSize] = useMeasuredWidth<HTMLDivElement>();
    const [leadSlot, setLeadSlot] = useState<HTMLDivElement | null>(null);
    const [actionsSlot, setActionsSlot] = useState<HTMLDivElement | null>(null);
    const sidebarCollapsed = useSidebarWidthStore((s) => s.collapsed);

    const slots = useMemo(
        () => ({ lead: leadSlot, actions: actionsSlot }),
        [leadSlot, actionsSlot],
    );
    const notchWidth = actionsSize.width + ACTIONS_INSET_RIGHT + ACTIONS_NOTCH_GUTTER;

    return (
        <div
            ref={frameRef}
            style={{ "--pane-top-inset": `${PANE_FRAME_NOTCH_HEIGHT}px` } as CSSProperties}
            className="relative flex min-w-0 flex-1 flex-col"
        >
            <PaneFrameShape
                width={frame.width}
                height={frame.height}
                notchWidth={notchWidth}
                className="pointer-events-none absolute inset-0"
            />

            <div
                className="absolute top-0 z-10 flex items-center gap-2"
                style={{ height: PANE_FRAME_NOTCH_HEIGHT, left: LEAD_INSET_LEFT }}
            >
                {lead}
                {!sidebarCollapsed && (
                    <div ref={setLeadSlot} className="flex min-w-0 items-center" />
                )}
            </div>

            <div
                ref={setActionsSlot}
                className="absolute top-0 z-10 flex items-center"
                style={{
                    height: PANE_FRAME_NOTCH_HEIGHT,
                    right: notchWidth + PANE_FRAME_SLANT_WIDTH + PANE_ACTIONS_GAP,
                }}
            />

            <div
                ref={actionsRef}
                className="absolute top-0 z-10 flex items-center"
                style={{ height: PANE_FRAME_NOTCH_HEIGHT, right: ACTIONS_INSET_RIGHT }}
            >
                {actions}
            </div>

            <PaneSlotsProvider value={slots}>
                <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
            </PaneSlotsProvider>
        </div>
    );
}
