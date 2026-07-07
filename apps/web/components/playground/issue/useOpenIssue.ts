"use client";
import { useParams } from "next/navigation";
import { useOpenIssueStore } from "@/store/issues/useOpenIssueStore";

/**
 * Public API for the shareable issue dialog. `openIssue(id)` opens the dialog and
 * appends `…/issue/<id>` to the URL; `closeIssue()` closes it and strips the
 * segment back off. Both write the URL with the native History API (no Next
 * navigation), so — paired with the optional catch-all route that keeps both URLs
 * on one page component — the board never remounts or refetches.
 *
 * This hook has no effects, so it is safe to call from many components at once
 * (every card, plus the dialog). The URL → store direction (mount hydration for
 * deep-links + Back/Forward) lives in `useOpenIssueUrlSync`, mounted once.
 */
export function useOpenIssue() {
    const { orgSlug, projectSlug } = useParams<{ orgSlug: string; projectSlug?: string }>();
    const openIssueId = useOpenIssueStore((s) => s.openIssueId);
    const setOpenIssueId = useOpenIssueStore((s) => s.setOpenIssueId);

    // Base path of the current project workspace, without any `/issue/<id>` tail.
    const basePath = `/playground/${orgSlug}${projectSlug ? `/${projectSlug}` : ""}`;

    function openIssue(id: string) {
        setOpenIssueId(id);
        // `pushState` (not `replaceState`) so the browser Back button also closes.
        window.history.pushState(null, "", `${basePath}/issue/${id}${window.location.search}`);
    }

    function closeIssue() {
        setOpenIssueId(null);
        window.history.pushState(null, "", `${basePath}${window.location.search}`);
    }

    return { openIssueId, openIssue, closeIssue };
}
