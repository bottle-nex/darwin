"use client";
import type { Capsule, CapsuleFidelity, CapsuleRevision } from "@trymatcha/types";

import { MICRO_LABEL } from "@/components/playground/Core/components/paneBar";
import { BLURRED_BG_ONE } from "@/components/playground/Home/KanbanDisplay/cardStyles";
import { useUserConfig } from "@/hooks/user/useUserConfig";
import { cn } from "@/lib/utils";

const IFRAME_SANDBOX = "allow-scripts allow-same-origin";
const MAX_PANE_HEIGHT = 720;

const ABSENT_REASON: Record<Capsule["change"], string> = {
    Modified: "This revision could not be rendered.",
    Added: "This component did not exist before the pull request.",
    Removed: "This component is deleted by the pull request.",
};

export default function CapsuleComparison({
    capsule,
    urls,
    controlHash,
}: {
    capsule: Capsule;
    urls: Record<string, string>;
    controlHash: string;
}) {
    const glass = useUserConfig().backgroundLightingEnabled;

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
                <Pane
                    label="Before"
                    capsule={capsule}
                    revision={capsule.base}
                    url={capsule.base ? urls[capsule.base.path] : undefined}
                    controlHash={controlHash}
                    glass={glass}
                />
                <Pane
                    label="After"
                    capsule={capsule}
                    revision={capsule.head}
                    url={capsule.head ? urls[capsule.head.path] : undefined}
                    controlHash={controlHash}
                    glass={glass}
                />
            </div>
            <p className="text-[12px] text-neutral-500">
                Sample data — the values shown are synthetic and identical on both sides. Layout,
                styling and behaviour are real.
            </p>
        </div>
    );
}

function Pane({
    label,
    capsule,
    revision,
    url,
    controlHash,
    glass,
}: {
    label: string;
    capsule: Capsule;
    revision: CapsuleRevision | null;
    url: string | undefined;
    controlHash: string;
    glass: boolean;
}) {
    const height = Math.min(capsule.viewport.height, MAX_PANE_HEIGHT);

    return (
        <section className="flex min-w-0 flex-col gap-2">
            <div className="flex items-center gap-2">
                <span className={MICRO_LABEL}>{label}</span>
                {revision && <Fidelity value={revision.fidelity} />}
            </div>
            <div
                className={cn(
                    "overflow-hidden rounded-lg border border-snow/5 p-1.5",
                    BLURRED_BG_ONE(glass),
                )}
            >
                {revision && url ? (
                    <iframe
                        key={revision.path}
                        title={`${capsule.title} ${label}`}
                        src={`${url}#${controlHash}`}
                        sandbox={IFRAME_SANDBOX}
                        style={{ height }}
                        className="w-full rounded-md bg-white/2"
                    />
                ) : (
                    <p className="px-4 py-10 text-center text-[13px] text-neutral-500">
                        {ABSENT_REASON[capsule.change]}
                    </p>
                )}
            </div>
            {revision && revision.diagnostics.length > 0 && (
                <ul className="flex flex-col gap-1">
                    {revision.diagnostics.map((diagnostic) => (
                        <li key={diagnostic} className="text-[11px] leading-relaxed text-amber-300/80">
                            {diagnostic}
                        </li>
                    ))}
                </ul>
            )}
        </section>
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
