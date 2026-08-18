import type { IssueStatus } from "../prisma/enums.prisma";

export type ReferenceKind = "member" | "issue";

export type ReferencedIssueLabel = {
    id?: string;
    number: number;
    title: string;
    status?: IssueStatus;
    description?: string;
    priority?: number;
};

export type LabelledReference = {
    memberId: string | null;
    issueId: string | null;
    member?: { user?: { name: string | null; email: string } | null } | null;
    issue?: ReferencedIssueLabel | null;
};

export type ParsedReference = {
    kind: ReferenceKind;
    id: string;
    start: number;
    end: number;
};

const TOKEN_SOURCE = String.raw`([@#])\[(member|issue):([A-Za-z0-9_-]+)\]`;

export function reference_token_pattern(): RegExp {
    return new RegExp(TOKEN_SOURCE, "g");
}

export function reference_split_pattern(): RegExp {
    return new RegExp(String.raw`([@#]\[(?:member|issue):[A-Za-z0-9_-]+\])`, "g");
}

export function reference_key(kind: ReferenceKind, id: string): string {
    return `${kind}:${id}`;
}

export function parse_reference_token(literal: string): { kind: ReferenceKind; id: string } | null {
    const match = new RegExp(`^${TOKEN_SOURCE}$`).exec(literal);
    const kind = match?.[2];
    const id = match?.[3];
    if (!kind || !id) return null;
    return { kind: kind as ReferenceKind, id };
}

export function parse_reference_tokens(text: string): ParsedReference[] {
    return [...text.matchAll(reference_token_pattern())].flatMap((match) => {
        const kind = match[2];
        const id = match[3];
        if (!kind || !id) return [];
        return [
            {
                kind: kind as ReferenceKind,
                id,
                start: match.index,
                end: match.index + match[0].length,
            },
        ];
    });
}

export function reference_ids(text: string, kind: ReferenceKind): string[] {
    return [
        ...new Set(
            parse_reference_tokens(text)
                .filter((reference) => reference.kind === kind)
                .map((reference) => reference.id),
        ),
    ];
}

export function filter_reference_tokens(
    text: string,
    keep: (kind: ReferenceKind, id: string) => boolean,
): string {
    let dropped = false;
    const filtered = text.replace(
        reference_token_pattern(),
        (literal, _sigil, kind: ReferenceKind, id: string) => {
            if (keep(kind, id)) return literal;
            dropped = true;
            return "";
        },
    );
    // Left untouched unless a token actually went — otherwise this would quietly
    // reflow spacing the sender typed on purpose.
    return dropped ? filtered.replace(/[^\S\n]{2,}/g, " ").trim() : text;
}

export function member_label(name: string | null | undefined, email?: string | null): string {
    return `@${name ?? email ?? "Unknown"}`;
}

export function issue_label(number: number, title: string): string {
    return `#${number} ${title}`;
}

export function reference_labels(references: LabelledReference[]): Map<string, string> {
    const labels = new Map<string, string>();
    for (const reference of references) {
        if (reference.memberId && reference.member?.user) {
            labels.set(
                reference_key("member", reference.memberId),
                member_label(reference.member.user.name, reference.member.user.email),
            );
        }
        if (reference.issueId && reference.issue) {
            labels.set(
                reference_key("issue", reference.issueId),
                issue_label(reference.issue.number, reference.issue.title),
            );
        }
    }
    return labels;
}

export function reference_issues(
    references: LabelledReference[],
): Map<string, ReferencedIssueLabel> {
    const issues = new Map<string, ReferencedIssueLabel>();
    for (const reference of references) {
        if (reference.issueId && reference.issue) issues.set(reference.issueId, reference.issue);
    }
    return issues;
}

const TOMBSTONE: Record<ReferenceKind, string> = {
    member: "@Unknown",
    issue: "#deleted issue",
};

export function to_plain_text(text: string, references: LabelledReference[]): string {
    const labels = reference_labels(references);
    return text.replace(
        reference_token_pattern(),
        (_literal, _sigil, kind: ReferenceKind, id: string) =>
            labels.get(reference_key(kind, id)) ?? TOMBSTONE[kind],
    );
}
