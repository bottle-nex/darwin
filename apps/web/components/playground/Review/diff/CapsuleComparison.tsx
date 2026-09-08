"use client";
import { type Capsule, capsule_control_hash, type CapsuleRevision } from "@trydarwin/types";
import { useEffect, useRef, useState } from "react";

import {
    CAPSULE_FRAMES,
    type CapsuleCompareMode,
    type CapsuleViewport,
} from "@/types/capsule.type";

import CapsuleSlider from "./CapsuleSlider";
import CapsuleToolbar from "./CapsuleToolbar";
import DiffFrame, { FRAME_BORDER_X, FRAME_CHROME_X, FRAME_SHELL } from "./DiffFrame";

const IFRAME_SANDBOX = "allow-scripts allow-same-origin";
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
    controlValues,
    onControlChange,
}: {
    capsule: Capsule;
    urls: Record<string, string>;
    controlValues: Record<string, string>;
    onControlChange: (name: string, value: string) => void;
}) {
    const [viewport, setViewport] = useState<CapsuleViewport>("desktop");
    const [mode, setMode] = useState<CapsuleCompareMode>("split");
    const surface = useRef<HTMLDivElement>(null);
    const available = useAvailableWidth(surface);

    const controlHash = capsule_control_hash(defaults_with(capsule, controlValues));

    const comparable = capsule.base !== null && capsule.head !== null;
    const activeMode = comparable ? mode : "split";

    const intrinsic = CAPSULE_FRAMES[viewport];

    // A desktop frame is 1440 wide: side by side it would scale to a third and be unreadable, so
    // the revisions stack and each gets the whole pane. A phone frame is narrow enough to sit in a
    // row, which is also the easier read for it.
    const columns = activeMode === "split" && viewport === "mobile" ? 2 : 1;
    const chrome = activeMode === "slider" ? FRAME_BORDER_X : FRAME_CHROME_X;
    const perPane = Math.max(0, (available - SPLIT_GAP * (columns - 1)) / columns - chrome);
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
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
            <div className="relative min-h-0 flex-1">
                <div ref={surface} data-lenis-prevent className="h-full overflow-auto no-scrollbar">
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
                            <DiffFrame label="Before" width={painted.width} height={painted.height}>
                                {frame("Before", capsule.base)}
                            </DiffFrame>
                            <DiffFrame
                                label="After"
                                mirrored
                                width={painted.width}
                                height={painted.height}
                            >
                                {frame("After", capsule.head)}
                            </DiffFrame>
                        </div>
                    )}
                </div>

                <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
                    <CapsuleToolbar
                        viewport={viewport}
                        onViewportChange={setViewport}
                        mode={activeMode}
                        onModeChange={setMode}
                        sliderDisabledReason={
                            comparable ? undefined : MISSING_SIDE_REASON[capsule.change]
                        }
                        controls={capsule.controls}
                        controlValues={controlValues}
                        onControlChange={onControlChange}
                    />
                </div>
            </div>
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
    // The key deliberately leaves the frame size out. Changing an iframe's width resizes the
    // document inside it, which is the re-layout we want; keying on the size would remount it and
    // fetch the page again, which reads as a flash every time the device is switched.
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
                key={revision.path}
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

function defaults_with(capsule: Capsule, values: Record<string, string>) {
    const merged: Record<string, string> = {};
    for (const control of capsule.controls) {
        const override = values[control.name];
        merged[control.name] =
            override === undefined || override === "" ? String(control.default) : override;
    }
    return merged;
}
