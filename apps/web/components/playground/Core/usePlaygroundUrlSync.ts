"use client";
import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import type { ProjectTeam } from "@/types/project";
import type { IssueThreadSummary } from "@/types/thread";
import {
    TEAM_DETAIL_TAB,
    THREAD_DETAIL_TAB,
    usePlaygroundNavStore,
} from "@/store/playground/usePlaygroundNavStore";

/**
 * Keeps the playground's navigation state and the browser URL in sync, so a
 * refresh restores the exact view (the active tab, the open team, the open
 * thread).
 *
 * The store stays the single source of truth for rendering; this hook just
 * mirrors it. On mount it hydrates the store from `?tab=&team=&thread=` (the
 * team/issue thread are resolved from their slug/id once the project's teams
 * and issue threads have loaded). Afterwards it writes state changes back to
 * the URL with the native History API — no Next navigation, so there's no
 * refetch or flicker. We snapshot the initial query params before the first
 * write so the writes can't clobber the values we still need to hydrate from.
 *
 * @param teams Teams of the active project (used to resolve `team` → object).
 * @param issueThreads Issue threads of the active project (used to resolve `thread` → issue).
 */
export function usePlaygroundUrlSync(
    teams: ProjectTeam[] | undefined,
    issueThreads: IssueThreadSummary[] | undefined,
) {
    const { projectSlug } = useParams<{ projectSlug?: string }>();

    const tab = usePlaygroundNavStore((s) => s.tab);
    const selectedTeam = usePlaygroundNavStore((s) => s.selectedTeam);
    const setTab = usePlaygroundNavStore((s) => s.setTab);
    const openTeam = usePlaygroundNavStore((s) => s.openTeam);
    const selectedThread = usePlaygroundNavStore((s) => s.selectedThread);
    const openThread = usePlaygroundNavStore((s) => s.openThread);

    const initialRef = useRef<{ tab: string | null; team: string | null; thread: string | null }>({
        tab: null,
        team: null,
        thread: null,
    });
    const hydratedRef = useRef(false);
    const teamHydratedRef = useRef(false);
    const threadHydratedRef = useRef(false);

    // Hydrate the active tab from the URL once on mount.
    useEffect(() => {
        if (hydratedRef.current) return;
        const params = new URLSearchParams(window.location.search);
        initialRef.current = {
            tab: params.get("tab"), // active tab -> threads, kanban, etc
            team: params.get("team"), // team slug, when the tab is team-detail
            thread: params.get("thread"), // "project" or an issue id, when the tab is thread-detail
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

    // Resolve the thread-detail target once the issue threads have loaded
    // ("project" needs no lookup — it resolves immediately).
    useEffect(() => {
        if (threadHydratedRef.current) return;
        const { tab: tabParam, thread: threadParam } = initialRef.current;
        if (tabParam !== THREAD_DETAIL_TAB || !threadParam) {
            threadHydratedRef.current = true;
            return;
        }
        if (threadParam === "project") {
            openThread({ kind: "project" }, projectSlug ?? "");
            threadHydratedRef.current = true;
            return;
        }
        if (!issueThreads) return; // wait for the project's threads to load
        const issue = issueThreads.find((t) => t.id === threadParam);
        if (issue) {
            openThread(
                {
                    kind: "issue",
                    issueId: issue.id,
                    issueNumber: issue.number,
                    issueTitle: issue.title,
                },
                projectSlug ?? "",
            );
        }
        threadHydratedRef.current = true;
    }, [issueThreads, openThread, projectSlug]);

    // Mirror nav state back into the URL. Gated on hydration completing so the
    // initial params survive until they've been consumed.
    useEffect(() => {
        if (!hydratedRef.current || !teamHydratedRef.current || !threadHydratedRef.current) return;
        const params = new URLSearchParams(window.location.search);
        params.delete("surface"); // legacy param — surfaces are gone
        params.set("tab", tab);
        if (tab === TEAM_DETAIL_TAB && selectedTeam) params.set("team", selectedTeam.slug);
        else params.delete("team");
        if (tab === THREAD_DETAIL_TAB && selectedThread) {
            params.set(
                "thread",
                selectedThread.kind === "project" ? "project" : selectedThread.issueId,
            );
        } else {
            params.delete("thread");
        }
        const next = `${window.location.pathname}?${params.toString()}`;
        if (next !== `${window.location.pathname}${window.location.search}`) {
            window.history.replaceState(null, "", next);
        }
    }, [tab, selectedTeam, selectedThread]);
}
