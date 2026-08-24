"use client";

import { motion } from "motion/react";

import { Button } from "@/components/ui/button";

import { MatchaLogo } from "../logo/MatchaLogo";
import { screenVariants, stepItemVariants } from "./choreography";
import type { TourDraft } from "./steps";

export default function DoneScreen({
    draft,
    loading,
    onFinish,
}: {
    draft: TourDraft;
    loading?: boolean;
    onFinish: () => void;
}) {
    const rows = [
        { label: "Project", value: draft.title || "Untitled" },
        { label: "Summary", value: draft.summary || "—" },
        { label: "Team", value: draft.teamName || "Skipped" },
    ];

    return (
        <motion.div
            variants={screenVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="pointer-events-auto absolute top-[18vh] left-[8vw] w-full max-w-xl pr-6"
        >
            <motion.p variants={stepItemVariants} className="text-[13px] text-neutral-500">
                Setup complete
            </motion.p>
            <motion.h2
                variants={stepItemVariants}
                className="mt-3 text-4xl font-medium tracking-tight text-neutral-100 md:text-5xl"
            >
                That&apos;s the run.
            </motion.h2>
            <motion.p
                variants={stepItemVariants}
                className="mt-4 max-w-md text-[15px] leading-relaxed text-neutral-400"
            >
                The board is live. File the first issue whenever you&apos;re ready — the agent takes
                it from there.
            </motion.p>
            <motion.div variants={stepItemVariants} className="mt-9 max-w-md">
                {rows.map((row) => (
                    <div
                        key={row.label}
                        className="flex items-baseline gap-8 border-b border-white/8 py-3.5 first:border-t"
                    >
                        <span className="w-20 shrink-0 text-[13px] text-neutral-500">
                            {row.label}
                        </span>
                        <span className="truncate text-[15px] text-neutral-200">{row.value}</span>
                    </div>
                ))}
            </motion.div>
            <motion.div variants={stepItemVariants} className="mt-10">
                <Button loading={loading} onClick={onFinish}>
                    <span>Open the board</span>
                    <MatchaLogo className="size-4.5" />
                </Button>
            </motion.div>
        </motion.div>
    );
}
