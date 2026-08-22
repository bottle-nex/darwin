"use client";
import { useIssueStore } from "@/store/issues/useIssueStore";

export function useIssueNavigation() {
    const openIssue = useIssueStore((s) => s.openIssue);
    const openIssueDiff = useIssueStore((s) => s.openIssueDiff);
    const showIssueDetail = useIssueStore((s) => s.showIssueDetail);
    const close = useIssueStore((s) => s.close);

    return { openIssue, openIssueDiff, showIssueDetail, close };
}
