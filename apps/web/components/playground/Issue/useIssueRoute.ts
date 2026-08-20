"use client";
import { useEffect } from "react";
import { issueIdFromPath, useIssueStore } from "@/store/issues/useIssueStore";

export function useIssueRoute({ sync = false }: { sync?: boolean } = {}) {
    const openIssueId = useIssueStore((s) => (s.mode?.kind === "open" ? s.mode.issueId : null));
    const syncIssue = useIssueStore((s) => s.syncIssue);

    useEffect(() => {
        if (!sync) return;
        const readFromUrl = () => syncIssue(issueIdFromPath(window.location.pathname));
        readFromUrl();
        window.addEventListener("popstate", readFromUrl);
        return () => window.removeEventListener("popstate", readFromUrl);
    }, [sync, syncIssue]);

    return { openIssueId };
}
