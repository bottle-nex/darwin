"use client";
import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import type { ProjectTeam } from "@/types/project";
import { TEAM_DETAIL_TAB, usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";

/**
 * Keeps the playground's navigation state and the browser URL in sync, so a
 * refresh restores the exact view (the active tab and the open team).
 *
 * The store stays the single source of truth for rendering; this hook just
 * mirrors it. On mount it hydrates the store from `?tab=&team=` (the team is
 * resolved from its slug once the project's teams have loaded). Afterwards it
 * writes state changes back to the URL with the native History API — no Next
 * navigation, so there's no refetch or flicker. We snapshot the initial query
 * params before the first write so the writes can't clobber the values we still
 * need to hydrate from.
 *
 * @param teams Teams of the active project (used to resolve `team` → object).
 */
export function usePlaygroundUrlSync(teams: ProjectTeam[] | undefined) {
    const { projectSlug } = useParams<{ projectSlug?: string }>();

    const tab = usePlaygroundNavStore((s) => s.tab);
    const selectedTeam = usePlaygroundNavStore((s) => s.selectedTeam);
    const setTab = usePlaygroundNavStore((s) => s.setTab);
    const openTeam = usePlaygroundNavStore((s) => s.openTeam);

    const initialRef = useRef<{ tab: string | null; team: string | null }>({
        tab: null,
        team: null,
    });
    const hydratedRef = useRef(false);
    const teamHydratedRef = useRef(false);

    // Hydrate the active tab from the URL once on mount.
    useEffect(() => {
        if (hydratedRef.current) return;
        const params = new URLSearchParams(window.location.search);
        initialRef.current = {
            tab: params.get("tab"), // active tab -> inbox, mentions, kanban, etc
            team: params.get("team"), // team slug, when the tab is team-detail
        };
        const { tab: tabParam } = initialRef.current;
        if (tabParam) setTab(tabParam);
        hydratedRef.current = true;
    }, [setTab]);

    // Resolve the team-detail target from its slug once the teams have loaded.
    // Runs after the hydrate effect, so `initialRef` is already populated.
    useEffect(() => {
        if (teamHydratedRef.current) return;
        const { tab: tabParam, team: teamParam } = initialRef.current;
        if (tabParam !== TEAM_DETAIL_TAB || !teamParam) {
            teamHydratedRef.current = true;
            return;
        }
        if (!teams) return; // wait for the project to load
        const team = teams.find((t) => t.slug === teamParam);
        if (team) openTeam(team, projectSlug ?? "");
        teamHydratedRef.current = true;
    }, [teams, openTeam, projectSlug]);

    // Mirror nav state back into the URL. Gated on hydration completing so the
    // initial params survive until they've been consumed.
    useEffect(() => {
        if (!hydratedRef.current || !teamHydratedRef.current) return;
        const params = new URLSearchParams(window.location.search);
        params.delete("surface"); // legacy param — surfaces are gone
        params.set("tab", tab);
        if (tab === TEAM_DETAIL_TAB && selectedTeam) params.set("team", selectedTeam.slug);
        else params.delete("team");
        const next = `${window.location.pathname}?${params.toString()}`;
        if (next !== `${window.location.pathname}${window.location.search}`) {
            window.history.replaceState(null, "", next);
        }
    }, [tab, selectedTeam]);
}
