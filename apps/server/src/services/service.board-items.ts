import { type Prisma, prisma } from "@trydarwin/database";

import { SPACE_SELECT } from "./service.board-issues";

export const TAG_SELECT = {
    id: true,
    name: true,
    color: true,
    createdAt: true,
    creator: { select: { id: true, name: true, image: true } },
} satisfies Prisma.TagSelect;

export const COLUMN_SELECT = {
    id: true,
    spaceId: true,
    label: true,
    order: true,
} satisfies Prisma.CustomColumnSelect;

/**
 * Creating the furniture a board is made of: tags, spaces and their columns.
 *
 * The writes live here rather than in each controller so Ask Darwin creates them exactly the way
 * the UI does — in particular the `order` of a new space or column, which is derived from the last
 * one rather than defaulted, and would put new items in the wrong place if reimplemented.
 *
 * Callers own their own permission checks; this is the write only.
 *
 * @example
 * const column = await BoardItemService.create_column(space.id, "Needs Triage");
 * // { id: "cl…", spaceId: "cl…", label: "Needs Triage", order: 5 }
 */
export default class BoardItemService {
    /** Throws Prisma's P2002 when the name is taken — callers map that to their own message. */
    static create_tag(
        project_id: string,
        actor_id: string,
        input: { name: string; color: string },
    ) {
        return prisma.tag.create({
            data: {
                projectId: project_id,
                name: input.name,
                color: input.color,
                createdById: actor_id,
            },
            select: TAG_SELECT,
        });
    }

    static create_space(
        project_id: string,
        input: {
            name: string;
            slug: string;
            description?: string | null;
            start_date?: Date | null;
            target_date?: Date | null;
            icon?: Prisma.InputJsonValue;
        },
    ) {
        return prisma.$transaction(async (tx) => {
            const last = await tx.space.findFirst({
                where: { projectId: project_id },
                orderBy: { order: "desc" },
                select: { order: true },
            });

            return tx.space.create({
                data: {
                    projectId: project_id,
                    name: input.name,
                    slug: input.slug,
                    description: input.description ?? null,
                    startDate: input.start_date ?? null,
                    targetDate: input.target_date ?? null,
                    order: (last?.order ?? 0) + 1,
                    icon: input.icon,
                },
                select: SPACE_SELECT,
            });
        });
    }

    static create_column(space_id: string, label: string) {
        return prisma.$transaction(async (tx) => {
            const last = await tx.customColumn.findFirst({
                where: { spaceId: space_id },
                orderBy: { order: "desc" },
                select: { order: true },
            });

            return tx.customColumn.create({
                data: { spaceId: space_id, label, order: (last?.order ?? 0) + 1 },
                select: COLUMN_SELECT,
            });
        });
    }
}
