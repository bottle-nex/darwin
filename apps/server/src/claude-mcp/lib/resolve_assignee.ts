import { prisma } from "@trydarwin/database";

import { best_matches } from "./fuzzy";

const CONFIDENT_MATCH_THRESHOLD = 0.85;
const SELF_ALIASES = ["me", "myself", "self", "i"];

export type AssigneeCandidate = {
    id: string;
    name: string;
    email: string;
};

export type ResolveAssigneeResult =
    { ok: true; assignee: AssigneeCandidate } | { ok: false; suggestions: AssigneeCandidate[] };

export async function resolve_assignee(
    requester: { id: string; name: string; email: string },
    project_id: string,
    assignee_query: string,
): Promise<ResolveAssigneeResult> {
    if (SELF_ALIASES.includes(assignee_query.trim().toLowerCase())) {
        return { ok: true, assignee: requester };
    }

    const members = await prisma.projectMember.findMany({
        where: { projectId: project_id },
        select: { user: { select: { id: true, name: true, email: true } } },
    });

    const candidates: AssigneeCandidate[] = members.map((member) => ({
        id: member.user.id,
        name: member.user.name ?? member.user.email,
        email: member.user.email,
    }));

    const name_matches = best_matches(
        assignee_query,
        candidates.map((item) => ({ item, label: item.name })),
        5,
    );
    const email_matches = best_matches(
        assignee_query,
        candidates.map((item) => ({ item, label: item.email })),
        5,
    );
    const matches = [...name_matches, ...email_matches]
        .sort((a, b) => b.score - a.score)
        .filter((match, index, all) => all.findIndex((m) => m.item.id === match.item.id) === index)
        .filter((match) => match.score >= 0.3)
        .slice(0, 5);

    if (!matches.length) {
        return { ok: false, suggestions: [] };
    }

    const [top, second] = matches;
    if (top.score >= CONFIDENT_MATCH_THRESHOLD && (!second || top.score - second.score >= 0.1)) {
        return { ok: true, assignee: top.item };
    }

    return { ok: false, suggestions: matches.map((match) => match.item) };
}
