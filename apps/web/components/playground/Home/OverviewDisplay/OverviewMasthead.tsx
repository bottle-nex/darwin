"use client";
import { motion } from "motion/react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { ProjectOverview } from "@/types/overview";
import { MetaDot, SECTION_VARIANTS, STATUS_THEME } from "./overviewTheme";

type OverviewMastheadProps = {
    overview: ProjectOverview;
};

export default function OverviewMasthead({ overview }: OverviewMastheadProps) {
    const status = STATUS_THEME[overview.status];

    return (
        <motion.header variants={SECTION_VARIANTS}>
            <div className="flex items-center gap-2.5">
                <h1 className="text-[32px] leading-[1.15] font-medium tracking-[-0.03em] text-neutral-100">
                    {overview.name}
                </h1>
                <span className="mt-1.5 rounded-[4px] bg-white/5 px-1.5 py-0.5 text-[11px] font-medium text-neutral-400">
                    {overview.key}
                </span>
            </div>

            <p className="mt-2.5 max-w-[60ch] text-[15px] leading-[1.6] text-neutral-300">
                {overview.purpose}
            </p>

            <p className="mt-5 max-w-[68ch] text-[13.5px] leading-[1.8] text-neutral-500">
                {overview.description}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-neutral-500">
                <span className="flex items-center gap-1.5">
                    <span className={cn("size-1.5 rounded-full", status.dot)} aria-hidden />
                    <span className={cn("font-medium", status.text)}>{status.label}</span>
                </span>

                <MetaDot />
                <span className="text-neutral-400">{overview.repo}</span>

                <MetaDot />
                <span>Updated {format(new Date(overview.updatedAt), "MMM d, yyyy")}</span>
            </div>
        </motion.header>
    );
}
