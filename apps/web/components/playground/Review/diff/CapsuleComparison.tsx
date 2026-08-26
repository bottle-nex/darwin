"use client";
import {
    type Capsule,
    type CapsuleFidelity,
    type CapsuleRevision,
    meaningful_diagnostics,
} from "@trymatcha/types";
import { useEffect, useRef, useState } from "react";

import { MICRO_LABEL } from "@/components/playground/Core/components/paneBar";
import { cn } from "@/lib/utils";
import {
    CAPSULE_FRAMES,
    type CapsuleCompareMode,
    type CapsuleViewport,
} from "@/types/capsule.type";

import CapsuleSlider from "./CapsuleSlider";
import CapsuleToolbar from "./CapsuleToolbar";

const IFRAME_SANDBOX = "allow-scripts allow-same-origin";
const FRAME_SHELL = "overflow-hidden rounded-lg border border-snow/10 bg-white/2";
const SPLIT_GAP = 12;
const TOOLBAR_CLEARANCE = 56;

const ABSENT_REASON: Record<Capsule["change"], string> = {
    Modified: "This revision could not be rendered.",
    Added: "This component did not exist before the pull request.",
    Removed: "This component is deleted by the pull request.",
};

const MISSING_SIDE_REASON: Record<Capsule["change"], string> = {
    Modified: "One revision could not be rendered, so there is nothing to wipe between",
    Added: "This component is new, so there is no before to compare against",
    Removed: "This component is deleted, so there is no after to compare against",
};

export default function CapsuleComparison({
    capsule,
    urls,
    controlHash,
    viewport,
    onViewportChange,
    mode,
    onModeChange,
}: {
    capsule: Capsule;
    urls: Record<string, string>;
    controlHash: string;
    viewport: CapsuleViewport;
    onViewportChange: (value: CapsuleViewport) => void;
    mode: CapsuleCompareMode;
    onModeChange: (value: CapsuleCompareMode) => void;
}) {
    const surface = useRef<HTMLDivElement>(null);
    const available = useAvailableWidth(surface);

    const comparable = capsule.base !== null && capsule.head !== null;
    const activeMode = comparable ? mode : "split";

    const intrinsic = CAPSULE_FRAMES[viewport];

    // A desktop frame is 1440 wide: side by side it would scale to a third and be unreadable, so
    // the revisions stack and each gets the whole pane. A phone frame is narrow enough to sit in a
    // row, which is also the easier read for it.
    const columns = activeMode === "split" && viewport === "mobile" ? 2 : 1;
    const perPane = (available - SPLIT_GAP * (columns - 1)) / columns;
    const scale = available === 0 ? 1 : Math.min(1, perPane / intrinsic.width);
    const painted = { width: intrinsic.width * scale, height: intrinsic.height * scale };

    const frame = (label: string, revision: CapsuleRevision | null) => (
        <Frame
            label={label}
            capsule={capsule}
            revision={revision}
            url={revision ? urls[revision.path] : undefined}
            controlHash={controlHash}
            intrinsic={intrinsic}
            scale={scale}
            painted={painted}
        />
    );

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="relative min-h-0 flex-1">
                <div
                    ref={surface}
                    data-lenis-prevent
                    className="h-full overflow-auto no-scrollbar"
                >
                    {activeMode === "slider" ? (
                        <CapsuleSlider
                            className={FRAME_SHELL}
                            width={painted.width}
                            height={painted.height}
                            before={frame("Before", capsule.base)}
                            after={frame("After", capsule.head)}
                        />
                    ) : (
                        <div
                            className="grid"
                            style={{
                                gap: SPLIT_GAP,
                                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                                paddingBottom: TOOLBAR_CLEARANCE,
                            }}
                        >
                            <Labelled
                                label="Before"
                                revision={capsule.base}
                                width={painted.width}
                                height={painted.height}
                            >
                                {frame("Before", capsule.base)}
                            </Labelled>
                            <Labelled
                                label="After"
                                revision={capsule.head}
                                width={painted.width}
                                height={painted.height}
                            >
                                {frame("After", capsule.head)}
                            </Labelled>
                        </div>
                    )}
                </div>

                <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
                    <CapsuleToolbar
                        viewport={viewport}
                        onViewportChange={onViewportChange}
                        mode={activeMode}
                        onModeChange={onModeChange}
                        sliderDisabledReason={
                            comparable ? undefined : MISSING_SIDE_REASON[capsule.change]
                        }
                    />
                </div>
            </div>

            {/*<Diagnostics capsule={capsule} scale={scale} />*/}
        </div>
    );
}

/**
 * The width the panes have to share, measured rather than assumed.
 *
 * The scale that keeps a desktop frame honest depends on how much room the pane actually has, and
 * that changes with the sidebar, the window and the properties rail. Nothing but the element knows
 * it, so it is observed.
 */
function useAvailableWidth(host: React.RefObject<HTMLDivElement | null>): number {
    const [width, setWidth] = useState(0);

    useEffect(() => {
        const node = host.current;
        if (!node) return;

        const observer = new ResizeObserver(([entry]) => {
            if (entry) setWidth(entry.contentRect.width);
        });
        observer.observe(node);
        return () => observer.disconnect();
    }, [host]);

    return width;
}

function Labelled({
    label,
    revision,
    width,
    height,
    children,
}: {
    label: string;
    revision: CapsuleRevision | null;
    width: number;
    height: number;
    children: React.ReactNode;
}) {
    return (
        <section className="flex min-w-0 flex-col gap-2">
            <div className="flex items-center gap-2">
                <span className={MICRO_LABEL}>{label}</span>
                {revision && <Fidelity value={revision.fidelity} />}
            </div>
            <div className={cn(FRAME_SHELL, "mx-auto")} style={{ width, height }}>
                {children}
            </div>
        </section>
    );
}

function Frame({
    label,
    capsule,
    revision,
    url,
    controlHash,
    intrinsic,
    scale,
    painted,
}: {
    label: string;
    capsule: Capsule;
    revision: CapsuleRevision | null;
    url: string | undefined;
    controlHash: string;
    intrinsic: { width: number; height: number };
    scale: number;
    painted: { width: number; height: number };
}) {
    if (!revision || !url) {
        return (
            <p
                className="flex items-center justify-center px-4 text-center text-[13px] text-neutral-500"
                style={{ height: painted.height }}
            >
                {ABSENT_REASON[capsule.change]}
            </p>
        );
    }

    return (
        <div
            className="mx-auto h-full w-full overflow-hidden"
            style={{ width: painted.width, height: painted.height }}
        >
            <iframe
                key={`${revision.path}-${intrinsic.width}`}
                title={`${capsule.title} ${label}`}
                src={`${url}#${controlHash}`}
                sandbox={IFRAME_SANDBOX}
                style={{
                    width: intrinsic.width,
                    height: intrinsic.height,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                }}
                className="border-0"
            />
        </div>
    );
}

function Diagnostics({ capsule, scale }: { capsule: Capsule; scale: number }) {
    const notes = [
        ...meaningful_diagnostics(capsule.base?.diagnostics ?? []).map((text) => ({
            side: "Before",
            text,
        })),
        ...meaningful_diagnostics(capsule.head?.diagnostics ?? []).map((text) => ({
            side: "After",
            text,
        })),
    ];

    return (
        <div className="flex flex-col gap-1">
            {scale < 1 && (
                <p className="text-[11px] text-neutral-500">
                    Scaled to {Math.round(scale * 100)}% to fit. The page itself is rendered at full
                    width, so its layout is the real one.
                </p>
            )}
            {notes.map((note) => (
                <p
                    key={`${note.side}-${note.text}`}
                    className="text-[11px] leading-relaxed text-amber-300/80"
                >
                    <span className="text-neutral-500">{note.side} · </span>
                    {note.text}
                </p>
            ))}
        </div>
    );
}

function Fidelity({ value }: { value: CapsuleFidelity }) {
    const paint =
        value === "Verified"
            ? "bg-emerald-400/15 text-emerald-300"
            : value === "Partial"
              ? "bg-amber-400/15 text-amber-300"
              : "bg-red-400/15 text-red-300";

    return (
        <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", paint)}>
            {value}
        </span>
    );
}
