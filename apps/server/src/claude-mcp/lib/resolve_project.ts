import { prisma } from "@trymatcha/database";
import { best_matches } from "./fuzzy";

const CONFIDENT_MATCH_THRESHOLD = 0.85;

export type ProjectCandidate = {
    id: string;
    name: string;
    slug: string;
    orgName: string;
    orgSlug: string;
};

export type ResolveProjectResult =
    { ok: true; project: ProjectCandidate } | { ok: false; suggestions: ProjectCandidate[] };

export async function resolve_project(
    user_id: string,
    project_query: string,
    org_query?: string,
): Promise<ResolveProjectResult> {
    const accessible_projects = await prisma.project.findMany({
        where: {
            OR: [
                { organization: { members: { some: { userId: user_id } } } },
                { members: { some: { userId: user_id } } },
            ],
        },
        select: {
            id: true,
            name: true,
            slug: true,
            organization: { select: { name: true, slug: true } },
        },
    });

    let candidates: ProjectCandidate[] = accessible_projects.map((project) => ({
        id: project.id,
        name: project.name,
        slug: project.slug,
        orgName: project.organization.name,
        orgSlug: project.organization.slug,
    }));

    if (org_query) {
        const org_matches = best_matches(
            org_query,
            candidates.map((item) => ({ item, label: item.orgName })),
            candidates.length,
        )
            .filter((match) => match.score >= 0.4)
            .map((match) => match.item);
        if (org_matches.length) {
            candidates = org_matches;
        }
    }

    const matches = best_matches(
        project_query,
        candidates.map((item) => ({ item, label: item.name })),
        5,
    ).filter((match) => match.score >= 0.3);

    if (!matches.length) {
        return { ok: false, suggestions: [] };
    }

    const [top, second] = matches;
    if (top.score >= CONFIDENT_MATCH_THRESHOLD && (!second || top.score - second.score >= 0.1)) {
        return { ok: true, project: top.item };
    }

    return { ok: false, suggestions: matches.map((match) => match.item) };
}
