import { Action, Permissions } from "@trydarwin/access-control";
import { Prisma, prisma } from "@trydarwin/database";
import z from "zod";

import BoardItemService from "../../service.board-items";
import { type DarwinContext, type DarwinTool, DarwinToolError } from "./tool.registry";

const DEFAULT_TAG_COLOR = "#8b8b8b";

const input = z
    .object({
        kind: z
            .enum(["tag", "space", "column"])
            .describe("tag = a label for issues. space = a board. column = a lane inside a space."),
        name: z.string().min(1).max(100).describe("The label the user will see."),
        space_id: z
            .string()
            .min(1)
            .optional()
            .describe("Required for kind=column: the space the column belongs to."),
        color: z
            .string()
            .regex(/^#[0-9a-fA-F]{6}$/)
            .optional()
            .describe("Only for kind=tag. A hex colour like #4f9d69. Omit for a neutral grey."),
        description: z
            .string()
            .max(280)
            .optional()
            .describe("Only for kind=space. One line about what the board is for."),
    })
    .strict();

/** Board slugs are lowercase words joined by hyphens, so the model never has to supply one. */
function to_slug(name: string): string {
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 50);
    return slug || `board-${Date.now().toString(36)}`;
}

/**
 * Create a tag, a space or a column.
 *
 * One tool for three things on purpose: three near-identical tool descriptions would make the
 * model choose badly, and creating board furniture is a single idea from the user's side.
 *
 * The permission differs by kind — tags need `manage_tags`, spaces and columns need
 * `manage_columns` — so the tool declares the looser one and checks the exact one here.
 *
 * @example
 * await create_board_item_tool.run({ kind: "space", name: "Design" }, ctx);
 * // { kind: "space", id: "cl…", name: "Design", slug: "design" }
 */
const create_board_item_tool: DarwinTool<typeof input> = {
    name: "create_board_item",
    description:
        "Create a tag, a board (space), or a column inside a board. Use this when the user asks " +
        "for a new label, board or lane that does not exist yet. To add a column you need the " +
        "space's id from get_project_context — create the space first if it is not there.",
    input,
    readOnly: false,
    action: Action.project.manage_columns,

    async run(args, ctx: DarwinContext) {
        if (args.kind === "tag") {
            if (!Permissions.project(ctx.role, Action.project.manage_tags)) {
                throw new DarwinToolError("You do not have permission to manage tags here.");
            }
            try {
                const tag = await BoardItemService.create_tag(ctx.projectId, ctx.userId, {
                    name: args.name,
                    color: args.color ?? DEFAULT_TAG_COLOR,
                });
                return {
                    output: { kind: "tag", id: tag.id, name: tag.name, color: tag.color },
                    resource: () => ({
                        kind: "board_item",
                        item: "tag",
                        id: tag.id,
                        name: tag.name,
                        color: tag.color,
                        parent: null,
                    }),
                };
            } catch (error) {
                if (
                    error instanceof Prisma.PrismaClientKnownRequestError &&
                    error.code === "P2002"
                ) {
                    throw new DarwinToolError(`A tag called "${args.name}" already exists.`);
                }
                throw error;
            }
        }

        if (args.kind === "space") {
            const space = await BoardItemService.create_space(ctx.projectId, {
                name: args.name,
                slug: to_slug(args.name),
                description: args.description ?? null,
            });
            return {
                output: { kind: "space", id: space.id, name: space.name, slug: space.slug },
                resource: () => ({
                    kind: "board_item",
                    item: "space",
                    id: space.id,
                    name: space.name,
                    color: null,
                    parent: null,
                }),
            };
        }

        if (!args.space_id) {
            throw new DarwinToolError(
                "A column has to belong to a board. Re-read the project to find the board, or " +
                    "create the board first.",
            );
        }
        const space = await prisma.space.findFirst({
            where: { id: args.space_id, projectId: ctx.projectId },
            select: { id: true, name: true },
        });
        if (!space) throw new DarwinToolError("That space is not in this project.");

        const column = await BoardItemService.create_column(space.id, args.name);
        return {
            output: { kind: "column", id: column.id, label: column.label, space: space.name },
            resource: () => ({
                kind: "board_item",
                item: "column",
                id: column.id,
                name: column.label,
                color: null,
                parent: space.name,
            }),
        };
    },
};

export default create_board_item_tool;
