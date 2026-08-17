"use client";
import { useEffect } from "react";
import { issueIdFromPath, useIssueStore } from "@/store/issues/useIssueStore";

export function useIssueRoute({ sync = false }: { sync?: boolean } = {}) {
    const mode = useIssueStore((s) => s.mode);
    const openIssue = useIssueStore((s) => s.openIssue);
    const syncIssue = useIssueStore((s) => s.syncIssue);
    const close = useIssueStore((s) => s.close);

    useEffect(() => {
        if (!sync) return;
        const readFromUrl = () => syncIssue(issueIdFromPath(window.location.pathname));
        readFromUrl();
        window.addEventListener("popstate", readFromUrl);
        return () => window.removeEventListener("popstate", readFromUrl);
    }, [sync, syncIssue]);

    return { mode, openIssue, close };
}
