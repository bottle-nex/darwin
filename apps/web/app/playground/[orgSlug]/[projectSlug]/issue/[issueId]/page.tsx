import PlaygroundShell from "@/components/playground/Core/PlaygroundShell";

/**
 * Deep-link target for the shareable issue dialog. Renders the same
 * `PlaygroundShell` as the project route so a pasted `…/issue/<id>` link resolves
 * (no 404); `useOpenIssue({ sync: true })` reads the `<id>` from the path on mount and opens
 * the dialog over the board. Soft open/close doesn't route here — it stays on the
 * project route and only rewrites the URL via the History API, so the board never
 * remounts.
 */
export default function IssueDeepLinkPage() {
    return <PlaygroundShell />;
}
