import type { ReferenceKind } from "@trymatcha/types";

export const MEMBER_TRIGGER = "@";
export const ISSUE_TRIGGER = "#";

export function kindFor(char: string): ReferenceKind {
    return char === ISSUE_TRIGGER ? "issue" : "member";
}

export function triggerFor(kind: ReferenceKind): string {
    return kind === "issue" ? ISSUE_TRIGGER : MEMBER_TRIGGER;
}
