"use client";
import { motion } from "motion/react";
import { LuGithub, LuSparkles, LuTriangleAlert } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import HeroBuddy from "@/components/landing/v2/HeroBuddy";
import type { PlanStatus } from "@/types/project";
import { SECTION_VARIANTS, SectionLabel } from "./overviewTheme";

const PLAIN_BUTTON = "font-sans normal-case";

const BODY_HEIGHT = "min-h-64";

type AgentBriefEmptyProps = {
    status: PlanStatus;
    repoFullName: string | null;
    branch: string | null;
    onGenerate: () => void;
    starting: boolean;
};

export default function AgentBriefEmpty({
    status,
    repoFullName,
    branch,
    onGenerate,
    starting,
}: AgentBriefEmptyProps) {
    const generating = status === "Generating" || starting;

    return (
        <motion.section variants={SECTION_VARIANTS}>
            <SectionLabel>Brief</SectionLabel>

            <div className="relative mt-3 overflow-hidden rounded-lg bg-cement">
                <div className="flex h-10 items-center justify-between gap-2 border-b border-white/5 pr-2 pl-4">
                    <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate font-mono text-[12px] text-neutral-400">
                            AGENTS.md
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-[4px] bg-violet-400/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-300">
                            <HeroBuddy move={false} className="size-3.5 shrink-0" />
                            Read by agent
                        </span>
                    </div>
                </div>

                <div
                    className={cn(
                        "flex flex-col items-center justify-center gap-4 px-6 py-12 text-center",
                        BODY_HEIGHT,
                    )}
                >
                    {generating ? (
                        <GeneratingBody repoFullName={repoFullName} branch={branch} />
                    ) : status === "Failed" ? (
                        <FailedBody onGenerate={onGenerate} />
                    ) : (
                        <PendingBody
                            repoFullName={repoFullName}
                            branch={branch}
                            onGenerate={onGenerate}
                        />
                    )}
                </div>
            </div>
        </motion.section>
    );
}

function RepoCaption({
    repoFullName,
    branch,
}: {
    repoFullName: string | null;
    branch: string | null;
}) {
    if (!repoFullName) return null;
    return (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-600">
            <LuGithub className="size-3" aria-hidden />
            <span className="font-mono">{repoFullName}</span>
            <span className="text-neutral-700">·</span>
            <span className="font-mono">{branch ?? "main"}</span>
        </span>
    );
}

function PendingBody({
    repoFullName,
    branch,
    onGenerate,
}: {
    repoFullName: string | null;
    branch: string | null;
    onGenerate: () => void;
}) {
    const connected = Boolean(repoFullName);

    return (
        <>
            <HeroBuddy move={false} className="size-10" />

            <div className="flex flex-col items-center gap-1.5">
                <p className="text-[13px] font-medium text-neutral-200">No brief yet</p>
                <p className="max-w-xs text-[12px] leading-relaxed text-neutral-500">
                    The agent writes this the first time it reads your repo — the context every
                    issue starts from.
                </p>
            </div>

            {connected ? (
                <div className="flex flex-col items-center gap-2.5">
                    <Button type="button" size="sm" onClick={onGenerate} className={PLAIN_BUTTON}>
                        <LuSparkles aria-hidden />
                        Generate brief
                    </Button>
                    <RepoCaption repoFullName={repoFullName} branch={branch} />
                </div>
            ) : (
                <p className="text-[12px] text-neutral-600">
                    Connect a repository in Settings to generate one.
                </p>
            )}
        </>
    );
}

function GeneratingBody({
    repoFullName,
    branch,
}: {
    repoFullName: string | null;
    branch: string | null;
}) {
    return (
        <>
            <HeroBuddy move className="size-10" />

            <div className="flex flex-col items-center gap-1.5">
                <p className="text-[13px] font-medium text-neutral-200">Reading your repo…</p>
                <p className="max-w-xs text-[12px] leading-relaxed text-neutral-500">
                    The agent is exploring the codebase and drafting the brief. This takes a couple
                    of minutes.
                </p>
            </div>

            <div className="h-1 w-40 overflow-hidden rounded-full bg-white/5">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-violet-400/60" />
            </div>

            <RepoCaption repoFullName={repoFullName} branch={branch} />
        </>
    );
}

function FailedBody({ onGenerate }: { onGenerate: () => void }) {
    return (
        <>
            <span className="flex size-10 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                <LuTriangleAlert className="size-4.5" aria-hidden />
            </span>

            <div className="flex flex-col items-center gap-1.5">
                <p className="text-[13px] font-medium text-neutral-200">Brief generation failed</p>
                <p className="max-w-xs text-[12px] leading-relaxed text-neutral-500">
                    Something went wrong while reading the repo. You can try again.
                </p>
            </div>

            <Button
                type="button"
                size="sm"
                variant="tertiary"
                onClick={onGenerate}
                className={PLAIN_BUTTON}
            >
                Try again
            </Button>
        </>
    );
}
