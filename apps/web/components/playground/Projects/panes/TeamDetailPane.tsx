"use client";
import { Users } from "lucide-react";
import { useParams } from "next/navigation";
import type { RailSurface } from "../../IconRail/railSurface";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";
import TeamViewMain from "../TeamView/TeamViewMain";

/**
 * The one fully-built pane: team detail. Shared by the Home and Projects
 * surfaces. Falls back to an empty state when the selected team belongs to a
 * different project than the one currently open (e.g. after navigating away).
 */
export default function TeamDetailPane({ surface }: { surface: RailSurface }) {
    const { projectSlug } = useParams<{ projectSlug?: string }>();
    const selectedTeam = usePlaygroundNavStore((s) => s.selectedTeam);
    const selectedTeamProjectSlug = usePlaygroundNavStore((s) => s.selectedTeamProjectSlug);
    const clearTeam = usePlaygroundNavStore((s) => s.clearTeam);

    if (!selectedTeam || selectedTeamProjectSlug !== projectSlug) {
        return <PaneEmptyState icon={Users} title="No team selected" />;
    }

    return <TeamViewMain team={selectedTeam} onClose={() => clearTeam(surface)} />;
}
