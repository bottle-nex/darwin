"use client";
import { motion } from "motion/react";
import PlaygroundAvatar, {
    displayNameOf,
    initialOf,
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import ProjectRoleTicker from "@/components/playground/Team/TeamView/ProjectRoleTicker";
import type { OverviewMember } from "@/types/overview";
import { SECTION_VARIANTS, SectionLabel } from "./overviewTheme";

type TeamSectionProps = {
    team: OverviewMember[];
    leadId: string;
};

export default function TeamSection({ team, leadId }: TeamSectionProps) {
    if (!team.length) return null;

    const ordered = [...team].sort((a, b) => Number(b.id === leadId) - Number(a.id === leadId));

    return (
        <motion.section variants={SECTION_VARIANTS}>
            <SectionLabel>Team</SectionLabel>

            <div className="mt-3 flex flex-col gap-1.5">
                {ordered.map((member) => (
                    <div
                        key={member.id}
                        className="flex items-center gap-3 rounded-lg bg-cement px-3 py-2.5"
                    >
                        <PlaygroundAvatar
                            letter={initialOf(member.name, member.email)}
                            tone={toneFor(member.id)}
                            src={member.image}
                            size="xl"
                        />

                        <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-[13px] font-medium text-neutral-200">
                                {displayNameOf(member.name, member.email)}
                            </span>
                            <span className="truncate text-[11.5px] text-neutral-600">
                                {member.email}
                            </span>
                        </div>

                        {member.id === leadId && (
                            <span className="shrink-0 text-[11.5px] text-neutral-500">Lead</span>
                        )}

                        <ProjectRoleTicker role={member.role} />
                    </div>
                ))}
            </div>
        </motion.section>
    );
}
