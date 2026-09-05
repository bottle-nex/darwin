import type { LabelledReference } from "@trymatcha/types";
import { to_plain_text } from "@trymatcha/types";
import TurndownService from "turndown";

export const DESCRIPTION_REFERENCE_INCLUDE = {
    member: { include: { user: true } },
    referencedIssue: {
        select: { id: true, number: true, title: true, status: true, priority: true },
    },
    team: { select: { id: true, name: true, icon: true } },
} as const;

export type DescriptionReferenceRow = {
    memberId: string | null;
    referencedIssueId: string | null;
    teamId: string | null;
    member?: { user?: { name: string | null; email: string } | null } | null;
    referencedIssue?: { number: number; title: string } | null;
    team?: { name: string } | null;
};

export function description_reference_labels(rows: DescriptionReferenceRow[]): LabelledReference[] {
    return rows.map((row) => ({
        memberId: row.memberId,
        issueId: row.referencedIssueId,
        teamId: row.teamId,
        member: row.member,
        issue: row.referencedIssue,
        team: row.team,
    }));
}

const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
});

turndown.escape = (text) => text;

export function issue_prompt_text(html: string, references: LabelledReference[]): string {
    return turndown.turndown(to_plain_text(html, references)).trim();
}
