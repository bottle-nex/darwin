"use client";
import { DARWIN_STEPS_PREVIEW, type DarwinToolState } from "@trydarwin/types";
import { AgentStepIcon, LoadingSpinnerIcon } from "@trydarwin/ui/icons";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { darwinToolLabel } from "../darwinToolLabels";

export type DarwinStepView = {
    callId: string;
    name: string;
    state?: DarwinToolState;
};

/**
 * What the answer did, as chips.
 *
 * Collapses past three: a one-to-three step answer reads as it always has, while a bulk run that
 * makes forty calls would otherwise push the answer itself off the screen.
 */
export default function DarwinSteps({ steps }: { steps: DarwinStepView[] }) {
    const [expanded, setExpanded] = useState(false);
    if (!steps.length) return null;

    const hidden = steps.length - DARWIN_STEPS_PREVIEW;
    const shown = expanded ? steps : steps.slice(0, DARWIN_STEPS_PREVIEW);

    return (
        <ul className="flex flex-wrap items-center gap-1.5">
            {shown.map((step) => (
                <li
                    key={step.callId}
                    className={cn(
                        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
                        step.state === "error"
                            ? "border-danger-edge bg-danger-surface text-danger"
                            : "border-transparent bg-overlay/4 text-neutral-400",
                    )}
                >
                    {step.state === "running" ? (
                        <LoadingSpinnerIcon className="size-3 animate-spin" aria-hidden />
                    ) : (
                        <AgentStepIcon className="size-3" aria-hidden />
                    )}
                    {darwinToolLabel(step.name)}
                </li>
            ))}

            {hidden > 0 && (
                <li>
                    <Button
                        variant="unstyled"
                        type="button"
                        onClick={() => setExpanded((open) => !open)}
                        className="cursor-pointer rounded-full bg-overlay/4 px-2.5 py-1 text-xs text-neutral-500 transition-colors hover:text-neutral-300"
                    >
                        {expanded ? "Show less" : `+${hidden} more`}
                    </Button>
                </li>
            )}
        </ul>
    );
}
