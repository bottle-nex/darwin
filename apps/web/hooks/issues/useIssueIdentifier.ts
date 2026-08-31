"use client";

import { useActiveProject } from "@/hooks/useActiveProject";
import { issueIdentifier } from "@/lib/format";

/**
 * Names an issue against the project currently open. The project resolves from
 * the route, so it is briefly undefined on first paint — the identifier falls
 * back to `ISS-42` for that frame rather than rendering nothing.
 */
export function useIssueIdentifier() {
    const projectName = useActiveProject()?.name;
    return (number: number | string) => issueIdentifier(projectName, number);
}
