"use client";
import type { Capsule, CapsuleFidelity, CapsuleRevision } from "@trymatcha/types";

import { MICRO_LABEL } from "@/components/playground/Core/components/paneBar";
import { BLURRED_BG_ONE } from "@/components/playground/Home/KanbanDisplay/cardStyles";
import { useUserConfig } from "@/hooks/user/useUserConfig";
import { cn } from "@/lib/utils";
import {
    type CapsuleCompareMode,
    type CapsuleViewport,
    MOBILE_FRAME,
} from "@/types/capsule.type";

import CapsuleSlider from "./CapsuleSlider";
import CapsuleToolbar from "./CapsuleToolbar";

const IFRAME_SANDBOX = "allow-scripts allow-same-origin";
const MAX_PANE_HEIGHT = 720;

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
    const glass = useUserConfig().backgroundLightingEnabled;

    const comparable = capsule.base !== null && capsule.head !== null;
    const activeMode = comparable ? mode : "split";
    const height =
        viewport === "mobile"
            ? Math.min(MOBILE_FRAME.height, MAX_PANE_HEIGHT)
            : Math.min(capsule.viewport.height, MAX_PANE_HEIGHT);

    const frame = (label: string, revision: CapsuleRevision | null) => (
        <Frame
            label={label}
            capsule={capsule}
            revision={revision}
            url={revision ? urls[revision.path] : undefined}
            controlHash={controlHash}
            viewport={viewport}
            height={height}
        />
    );

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="relative min-h-0 flex-1">
                <div
                    className={cn(
                        "overflow-hidden rounded-lg border border-snow/5 p-1.5",
                        BLURRED_BG_ONE(glass),
                    )}
                >
                    {activeMode === "slider" ? (
                        <CapsuleSlider
                            height={height}
                            width={viewport === "mobile" ? MOBILE_FRAME.width : null}
                            before={frame("Before", capsule.base)}
                            after={frame("After", capsule.head)}
                        />
                    ) : (
                        <div className="grid gap-3 lg:grid-cols-2">
                            <Labelled label="Before" revision={capsule.base}>
                                {frame("Before", capsule.base)}
                            </Labelled>
                            <Labelled label="After" revision={capsule.head}>
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

            <Diagnostics capsule={capsule} />

            <p className="text-[12px] text-neutral-500">
                Sample data — the values shown are synthetic and identical on both sides. Layout,
                styling and behaviour are real.
            </p>
        </div>
    );
}

function Labelled({
    label,
    revision,
    children,
}: {
    label: string;
    revision: CapsuleRevision | null;
    children: React.ReactNode;
}) {
    return (
        <section className="flex min-w-0 flex-col gap-2">
            <div className="flex items-center gap-2">
                <span className={MICRO_LABEL}>{label}</span>
                {revision && <Fidelity value={revision.fidelity} />}
            </div>
            {children}
        </section>
    );
}

function Frame({
    label,
    capsule,
    revision,
    url,
    controlHash,
    viewport,
    height,
}: {
    label: string;
    capsule: Capsule;
    revision: CapsuleRevision | null;
    url: string | undefined;
    controlHash: string;
    viewport: CapsuleViewport;
    height: number;
}) {
    if (!revision || !url) {
        return (
            <p
                className="flex items-center justify-center px-4 text-center text-[13px] text-neutral-500"
                style={{ height }}
            >
                {ABSENT_REASON[capsule.change]}
            </p>
        );
    }

    return (
        <div className="flex justify-center" style={{ height }}>
            <iframe
                key={`${revision.path}-${viewport}`}
                title={`${capsule.title} ${label}`}
                src={`${url}#${controlHash}`}
                sandbox={IFRAME_SANDBOX}
                style={{
                    height,
                    width: viewport === "mobile" ? MOBILE_FRAME.width : "100%",
                }}
                className="rounded-md bg-white/2"
            />
        </div>
    );
}

function Diagnostics({ capsule }: { capsule: Capsule }) {
    const notes = [
        ...(capsule.base?.diagnostics ?? []).map((text) => ({ side: "Before", text })),
        ...(capsule.head?.diagnostics ?? []).map((text) => ({ side: "After", text })),
    ];
    if (notes.length === 0) return null;

    return (
        <ul className="flex flex-col gap-1">
            {notes.map((note) => (
                <li
                    key={`${note.side}-${note.text}`}
                    className="text-[11px] leading-relaxed text-amber-300/80"
                >
                    <span className="text-neutral-500">{note.side} · </span>
                    {note.text}
                </li>
            ))}
        </ul>
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
