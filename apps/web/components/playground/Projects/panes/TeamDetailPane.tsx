"use client";
import { MdGroup } from "react-icons/md";
import { useParams } from "next/navigation";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";
import TeamViewMain from "../TeamView/TeamViewMain";

/**
 * The one fully-built pane: team detail. Shared by the Home and Projects
 * surfaces. Falls back to an empty state when the selected team belongs to a
 * different project than the one currently open (e.g. after navigating away).
 */
export default function TeamDetailPane() {
    const { projectSlug } = useParams<{ projectSlug?: string }>();
    const selectedTeam = usePlaygroundNavStore((s) => s.selectedTeam);
    const selectedTeamProjectSlug = usePlaygroundNavStore((s) => s.selectedTeamProjectSlug);

    if (!selectedTeam || selectedTeamProjectSlug !== projectSlug) {
        return <PaneEmptyState icon={MdGroup} title="No team selected" />;
    }

    return <TeamViewMain team={selectedTeam} />;
}
