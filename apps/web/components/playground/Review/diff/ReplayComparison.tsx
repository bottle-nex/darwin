"use client";
import type { ReplayRevisionArtifact } from "@trymatcha/types";
import { type ReactNode, useState } from "react";

import { MICRO_LABEL } from "@/components/playground/Core/components/paneBar";
import { Button } from "@/components/ui/button";
import { PRODUCT_DIFF_REPLAY_IFRAME_SANDBOX } from "@/lib/product-diff-replay";
import { cn } from "@/lib/utils";

import { diagnostics_for, Fidelity } from "./ReplaySurfaceCatalog";

type Revision = "base" | "head";
type ComparisonMode = "toggle" | "side-by-side";

export default function ReplayComparison({
    base,
    head,
    baseLaunchUrl,
    headLaunchUrl,
    isLoading,
}: {
    base: ReplayRevisionArtifact;
    head: ReplayRevisionArtifact;
    baseLaunchUrl?: string;
    headLaunchUrl?: string;
    isLoading: boolean;
}) {
    const [mode, setMode] = useState<ComparisonMode>("toggle");
    const [revision, setRevision] = useState<Revision>("head");
    const canCompare = Boolean(baseLaunchUrl && headLaunchUrl);
    const active =
        revision === "base"
            ? { artifact: base, url: baseLaunchUrl }
            : { artifact: head, url: headLaunchUrl };

    return (
        <div data-lenis-prevent className="min-h-0 flex-1 overflow-auto no-scrollbar">
            <div className="flex min-h-full flex-col gap-3 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1 rounded-md border border-white/5 bg-white/[0.025] p-0.5">
                        <ModeButton active={mode === "toggle"} onClick={() => setMode("toggle")}>
                            Toggle
                        </ModeButton>
                        <ModeButton
                            active={mode === "side-by-side"}
                            disabled={!canCompare}
                            onClick={() => setMode("side-by-side")}
                        >
                            Side by side
                        </ModeButton>
                    </div>
                    {mode === "toggle" && (
                        <div className="flex items-center gap-1">
                            <ModeButton
                                active={revision === "base"}
                                onClick={() => setRevision("base")}
                            >
                                Base
                            </ModeButton>
                            <ModeButton
                                active={revision === "head"}
                                onClick={() => setRevision("head")}
                            >
                                Head
                            </ModeButton>
                        </div>
                    )}
                </div>
                {mode === "side-by-side" && canCompare ? (
                    <div className="grid min-h-[32rem] gap-3 xl:grid-cols-2">
                        <ReplayFrame
                            label="Base"
                            artifact={base}
                            src={baseLaunchUrl}
                            isLoading={isLoading}
                        />
                        <ReplayFrame
                            label="Head"
                            artifact={head}
                            src={headLaunchUrl}
                            isLoading={isLoading}
                        />
                    </div>
                ) : (
                    <ReplayFrame
                        label={revision === "base" ? "Base" : "Head"}
                        artifact={active.artifact}
                        src={active.url}
                        isLoading={isLoading}
                    />
                )}
            </div>
        </div>
    );
}

function ModeButton({
    active,
    disabled,
    onClick,
    children,
}: {
    active: boolean;
    disabled?: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <Button
            size="xs"
            variant="unstyled"
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "rounded px-2 py-1 text-[11px] transition-colors",
                active ? "bg-white/10 text-neutral-100" : "text-neutral-500 hover:text-neutral-200",
            )}
        >
            {children}
        </Button>
    );
}

function ReplayFrame({
    label,
    artifact,
    src,
    isLoading,
}: {
    label: string;
    artifact: ReplayRevisionArtifact;
    src?: string;
    isLoading: boolean;
}) {
    const diagnostics = diagnostics_for(artifact);
    return (
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/5 bg-black/20">
            <header className="flex items-center justify-between gap-3 border-b border-white/5 px-3 py-2">
                <span className={MICRO_LABEL}>{label}</span>
                <Fidelity value={artifact.fidelity} />
            </header>
            {src ? (
                <iframe
                    title={`${label} replay`}
                    src={src}
                    sandbox={PRODUCT_DIFF_REPLAY_IFRAME_SANDBOX}
                    referrerPolicy="no-referrer"
                    className="min-h-[32rem] w-full flex-1 border-0 bg-white"
                />
            ) : (
                <div className="flex min-h-[32rem] flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
                    <p className="text-[13px] text-neutral-300">
                        {isLoading ? "Preparing replay" : "This revision cannot be replayed"}
                    </p>
                    {diagnostics.length > 0 && (
                        <p className="max-w-sm text-[12px] leading-relaxed text-neutral-500">
                            {diagnostics.join(" · ")}
                        </p>
                    )}
                </div>
            )}
        </section>
    );
}
