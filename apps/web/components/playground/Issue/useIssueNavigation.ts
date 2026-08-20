"use client";
import { useIssueStore } from "@/store/issues/useIssueStore";

export function useIssueNavigation() {
    const openIssue = useIssueStore((s) => s.openIssue);
    const close = useIssueStore((s) => s.close);

    return { openIssue, close };
}
