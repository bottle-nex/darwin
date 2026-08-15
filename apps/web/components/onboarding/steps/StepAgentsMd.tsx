"use client";

import { StepItem } from "../StepFrame";

const SAMPLE_LINES = [
    "# agents.md",
    "",
    "## Commands",
    "bun run build",
    "bun run lint",
    "",
    "## Conventions",
    "One controller per action.",
    "Never touch the migrations by hand.",
];

export default function StepAgentsMd() {
    return (
        <>
            <StepItem>
                <div className="max-w-md border-l-2 border-primary/40 bg-[#0C0C0E] py-4 pl-5 font-mono text-[13px] leading-6 text-neutral-500">
                    {SAMPLE_LINES.map((line, i) => (
                        <div key={i} className={line.startsWith("#") ? "text-neutral-300" : ""}>
                            {line || " "}
                        </div>
                    ))}
                </div>
            </StepItem>
            <StepItem>
                <p className="text-[13px] text-neutral-600">
                    Don&apos;t have one? The agent drafts a brief after its first run.
                </p>
            </StepItem>
        </>
    );
}
