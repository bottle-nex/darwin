"use client";
import { useEffect } from "react";
import { useCreateOrEditIssueStore } from "@/store/issues/useCreateOrEditIssueStore";

const ISSUE_SEGMENT = /\/issue\/([^/]+)\/?$/;

function issueIdFromPath(pathname: string): string | null {
    return pathname.match(ISSUE_SEGMENT)?.[1] ?? null;
}

function basePath(pathname: string): string {
    return pathname.replace(ISSUE_SEGMENT, "");
}

export function useIssueDialog({ sync = false }: { sync?: boolean } = {}) {
    const mode = useCreateOrEditIssueStore((s) => s.mode);
    const openCreate = useCreateOrEditIssueStore((s) => s.openCreate);
    const openEditInStore = useCreateOrEditIssueStore((s) => s.openEdit);
    const closeInStore = useCreateOrEditIssueStore((s) => s.close);

    useEffect(() => {
        if (!sync) return;
        const readFromUrl = () => {
            const id = issueIdFromPath(window.location.pathname);
            if (id) openEditInStore(id);
            else closeInStore();
        };
        readFromUrl();
        window.addEventListener("popstate", readFromUrl);
        return () => window.removeEventListener("popstate", readFromUrl);
    }, [sync, openEditInStore, closeInStore]);

    function openEdit(issueId: string) {
        openEditInStore(issueId);
        const base = basePath(window.location.pathname);
        window.history.pushState(null, "", `${base}/issue/${issueId}${window.location.search}`);
    }

    function close() {
        closeInStore();
        const base = basePath(window.location.pathname);
        if (base !== window.location.pathname) {
            window.history.pushState(null, "", `${base}${window.location.search}`);
        }
    }

    return { mode, openCreate, openEdit, close };
}
