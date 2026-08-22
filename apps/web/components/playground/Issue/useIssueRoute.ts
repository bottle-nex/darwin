"use client";
import { useEffect } from "react";
import { issueRouteFromPath, useIssueStore } from "@/store/issues/useIssueStore";

export function useIssueRoute({ sync = false }: { sync?: boolean } = {}) {
    const openIssueId = useIssueStore((s) => (s.mode?.kind === "open" ? s.mode.issueId : null));
    const issueView = useIssueStore((s) => (s.mode?.kind === "open" ? s.mode.view : null));
    const syncIssue = useIssueStore((s) => s.syncIssue);

    useEffect(() => {
        if (!sync) return;
        const readFromUrl = () => syncIssue(issueRouteFromPath(window.location.pathname));
        readFromUrl();
        window.addEventListener("popstate", readFromUrl);
        return () => window.removeEventListener("popstate", readFromUrl);
    }, [sync, syncIssue]);

    return { openIssueId, issueView };
}
