"use client";
import { useEffect } from "react";
import { useOpenIssueStore } from "@/store/issues/useOpenIssueStore";

/** Extract the issue id from a `…/issue/<id>` pathname, or `null` if absent. */
function issueIdFromPath(pathname: string): string | null {
    const match = pathname.match(/\/issue\/([^/]+)\/?$/);
    return match ? match[1] : null;
}

/**
 * Mirrors the URL into the open-issue store — the URL → store direction of the
 * shareable issue dialog. Call once in `PlaygroundShell` (like
 * `usePlaygroundUrlSync`). On mount it opens the dialog for a deep-linked
 * `…/issue/<id>` (share links, hard reloads), and a `popstate` listener re-reads
 * the path so browser Back/Forward toggles the dialog. The store → URL direction
 * lives in `useOpenIssue`.
 */
export function useOpenIssueUrlSync() {
    const setOpenIssueId = useOpenIssueStore((s) => s.setOpenIssueId);

    useEffect(() => {
        setOpenIssueId(issueIdFromPath(window.location.pathname));

        const onPopState = () => setOpenIssueId(issueIdFromPath(window.location.pathname));
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, [setOpenIssueId]);
}
