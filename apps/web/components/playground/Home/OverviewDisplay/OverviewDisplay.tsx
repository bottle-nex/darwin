"use client";
import { useState } from "react";
import { MotionConfig, motion } from "motion/react";
import { toast } from "sonner";
import { dummyProjectOverview } from "@/data/dummy-project-overview";
import OverviewOptionsBar from "./OverviewOptionsBar";
import OverviewMasthead from "./OverviewMasthead";
import AgentBrief from "./AgentBrief";
import SurfaceLinks from "./SurfaceLinks";
import TeamSection from "./TeamSection";
import { STAGGER_VARIANTS } from "./overviewTheme";

export default function OverviewDisplay() {
    const overview = dummyProjectOverview;
    const [markdown, setMarkdown] = useState(overview.brief.markdown);

    function saveBrief(next: string) {
        setMarkdown(next);
        toast.success("Brief updated.");
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <OverviewOptionsBar briefMarkdown={markdown} />

            <div data-lenis-prevent className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
                <MotionConfig reducedMotion="user">
                    <motion.div
                        variants={STAGGER_VARIANTS}
                        initial="hidden"
                        animate="show"
                        className="mx-auto flex w-full max-w-200 flex-col gap-10 px-6 py-10"
                    >
                        <div className="flex flex-col gap-5">
                            <SurfaceLinks links={overview.links} />
                            <OverviewMasthead overview={overview} />
                        </div>

                        <AgentBrief
                            markdown={markdown}
                            updatedAt={overview.brief.updatedAt}
                            onSave={saveBrief}
                        />

                        <TeamSection team={overview.team} leadId={overview.leadId} />
                    </motion.div>
                </MotionConfig>
            </div>
        </div>
    );
}
