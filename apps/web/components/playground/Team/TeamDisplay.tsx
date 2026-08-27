"use client";
import { TeamEntityIcon } from "@trymatcha/ui/icons";
import { useParams } from "next/navigation";

import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";

import TeamViewMain from "./TeamView/TeamViewMain";

/**
 * The one fully-built pane: team detail. Falls back to an empty state when the
 * selected team belongs to a different project than the one currently open
 * (e.g. after navigating away).
 */
export default function TeamDisplay() {
    const { projectSlug } = useParams<{ projectSlug?: string }>();
    const selectedTeam = usePlaygroundNavStore((s) => s.selectedTeam);
    const selectedTeamProjectSlug = usePlaygroundNavStore((s) => s.selectedTeamProjectSlug);

    if (!selectedTeam || selectedTeamProjectSlug !== projectSlug) {
        return <PaneEmptyState icon={TeamEntityIcon} title="No team selected" />;
    }

    return <TeamViewMain team={selectedTeam} />;
}
