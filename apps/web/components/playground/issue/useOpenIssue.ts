"use client";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useOpenIssueStore } from "@/store/issues/useOpenIssueStore";

function issueIdFromPath(pathname: string): string | null {
    return pathname.match(/\/issue\/([^/]+)\/?$/)?.[1] ?? null;
}

export function useOpenIssue({ sync = false }: { sync?: boolean } = {}) {
    const { orgSlug, projectSlug } = useParams<{ orgSlug: string; projectSlug?: string }>();
    const openIssueId = useOpenIssueStore((s) => s.openIssueId);
    const setOpenIssueId = useOpenIssueStore((s) => s.setOpenIssueId);

    const basePath = `/playground/${orgSlug}${projectSlug ? `/${projectSlug}` : ""}`;

    useEffect(() => {
        if (!sync) return;
        const readFromUrl = () => setOpenIssueId(issueIdFromPath(window.location.pathname));
        readFromUrl();
        window.addEventListener("popstate", readFromUrl);
        return () => window.removeEventListener("popstate", readFromUrl);
    }, [sync, setOpenIssueId]);

    function openIssue(id: string) {
        setOpenIssueId(id);
        window.history.pushState(null, "", `${basePath}/issue/${id}${window.location.search}`);
    }

    function closeIssue() {
        setOpenIssueId(null);
        window.history.pushState(null, "", `${basePath}${window.location.search}`);
    }

    return { openIssueId, openIssue, closeIssue };
}
