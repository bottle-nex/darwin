"use client";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";

import {
    isPlaygroundTab,
    PLAYGROUND_DEFAULT_TAB,
    type PlaygroundTab,
} from "@/components/playground/playgroundTabs";
import {
    CHAPTER_TAB,
    TEAM_DETAIL_TAB,
    usePlaygroundNavStore,
} from "@/store/playground/usePlaygroundNavStore";
import type { BoardChapter } from "@/types/board";
import type { ProjectTeam } from "@/types/project";

/**
 * Keeps the playground's navigation state and the browser URL in sync, so a
 * refresh restores the exact view (the active tab, the open team).
 *
 * The store stays the single source of truth for rendering; this hook just
 * mirrors it. On mount it hydrates the store from `?tab=&team=` (the team is
 * resolved from its slug once the project's teams have loaded). Afterwards it
 * writes state changes back to the URL with the native History API — no Next
 * navigation, so there's no refetch or flicker. We snapshot the initial query
 * params before the first write so the writes can't clobber the values we still
 * need to hydrate from.
 *
 * When no `?tab=` is present, the user's "default home view" preference is
 * applied once it loads — but only once, so it can never fight a later manual
 * tab switch or a background refetch of that preference.
 *
 * @param teams Teams of the active project (used to resolve `team` → object).
 * @param chapters Chapters of the active project (used to resolve `chapter` →
 *   object). A `chapter` slug that no longer exists falls back to the default tab.
 * @param defaultHomeView The user's default-home-view preference, translated
 *   to a `PlaygroundTab`. `undefined` while it's still loading.
 */
export function usePlaygroundUrlSync(
    teams: ProjectTeam[] | undefined,
    chapters: BoardChapter[] | undefined,
    defaultHomeView?: PlaygroundTab,
) {
    const { projectSlug } = useParams<{ projectSlug?: string }>();

    const tab = usePlaygroundNavStore((s) => s.tab);
    const selectedTeam = usePlaygroundNavStore((s) => s.selectedTeam);
    const selectedChapter = usePlaygroundNavStore((s) => s.selectedChapter);
    const setTab = usePlaygroundNavStore((s) => s.setTab);
    const openTeam = usePlaygroundNavStore((s) => s.openTeam);
    const openChapter = usePlaygroundNavStore((s) => s.openChapter);

    const initialRef = useRef<{ tab: string | null; team: string | null; chapter: string | null }>({
        tab: null,
        team: null,
        chapter: null,
    });
    const hydratedRef = useRef(false);
    const teamHydratedRef = useRef(false);
    const chapterHydratedRef = useRef(false);
    const preferenceAppliedRef = useRef(false);

    // Hydrate the active tab from the URL once on mount.
    useEffect(() => {
        if (hydratedRef.current) return;
        const params = new URLSearchParams(window.location.search);
        initialRef.current = {
            tab: params.get("tab"), // active tab -> chats, kanban, etc
            team: params.get("team"), // team slug, when the tab is team-detail
            chapter: params.get("chapter"), // chapter slug, when the tab is chapter
        };
        const { tab: tabParam } = initialRef.current;
        if (tabParam) setTab(isPlaygroundTab(tabParam) ? tabParam : PLAYGROUND_DEFAULT_TAB);
        hydratedRef.current = true;
    }, [setTab]);

    // Once, if no ?tab= was present, apply the user's default-home-view
    // preference as soon as it loads. Never fires again after that.
    useEffect(() => {
        if (preferenceAppliedRef.current || !hydratedRef.current) return;
        if (initialRef.current.tab) {
            preferenceAppliedRef.current = true;
            return;
        }
        if (defaultHomeView === undefined) return;
        setTab(defaultHomeView);
        preferenceAppliedRef.current = true;
    }, [defaultHomeView, setTab]);

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

    // Resolve the chapter target from its slug once the chapters have loaded.
    // A slug that no longer resolves falls back to the default tab rather than
    // leaving the pane on a chapter that isn't there.
    useEffect(() => {
        if (chapterHydratedRef.current) return;
        const { tab: tabParam, chapter: chapterParam } = initialRef.current;
        if (tabParam !== CHAPTER_TAB || !chapterParam) {
            chapterHydratedRef.current = true;
            return;
        }
        if (!chapters) return; // wait for the board metadata to load
        const chapter = chapters.find((c) => c.slug === chapterParam);
        if (chapter) openChapter(chapter, projectSlug ?? "");
        else setTab(PLAYGROUND_DEFAULT_TAB);
        chapterHydratedRef.current = true;
    }, [chapters, openChapter, setTab, projectSlug]);

    // Mirror nav state back into the URL. Gated on hydration completing so the
    // initial params survive until they've been consumed.
    useEffect(() => {
        if (!hydratedRef.current || !teamHydratedRef.current || !chapterHydratedRef.current) return;
        const params = new URLSearchParams(window.location.search);
        params.delete("surface"); // legacy param — surfaces are gone
        params.delete("thread"); // legacy param — issue threads are gone
        params.delete("preview"); // legacy param — the board-view dropdown is gone
        params.set("tab", tab);
        if (tab === TEAM_DETAIL_TAB && selectedTeam) params.set("team", selectedTeam.slug);
        else params.delete("team");
        if (tab === CHAPTER_TAB && selectedChapter) params.set("chapter", selectedChapter.slug);
        else params.delete("chapter");
        const next = `${window.location.pathname}?${params.toString()}`;
        if (next !== `${window.location.pathname}${window.location.search}`) {
            window.history.replaceState(null, "", next);
        }
    }, [tab, selectedTeam, selectedChapter]);
}
