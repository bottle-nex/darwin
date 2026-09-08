import { Action } from "@trydarwin/access-control";
import { prisma } from "@trydarwin/database";
import z from "zod";

import BoardIssueService from "../../service.board-issues";
import { issue_display_text } from "../../service.global-search";
import type { DarwinContext, DarwinTool } from "./tool.registry";
import { truncate } from "./tool.trim";

const PLAN_MAX_CHARS = 800;

const input = z.object({}).strict();

function as_text(value: string | null | undefined) {
    return value ? issue_display_text(value) : null;
}

/**
 * The id dictionary for every other tool.
 *
 * Writes need real cuids for assignees, tags and columns. Without this the model invents them,
 * so the system prompt tells it to call this first whenever it is about to write. Everything is
 * read from `ctx.projectId`; the model supplies nothing.
 *
 * @example
 * await get_project_context_tool.run({}, ctx);
 * // { members: [{ id: "cku...", name: "Rishi" }], tags: [...], columns: [...], totals: {...} }
 */
const get_project_context_tool: DarwinTool<typeof input> = {
    name: "get_project_context",
    description:
        "Read the current project: what it is about, its repository, tags, board columns and " +
        "per-lane issue counts. Use it to answer questions about the project itself, and call it " +
        "before creating or updating an issue — it is the only source of valid assignee, tag and " +
        "column ids. Never guess an id. For a question about the people themselves, read the " +
        "members instead.",
    input,
    readOnly: true,
    action: Action.project.read,
    fallbackCard: true,

    async run(_args, ctx: DarwinContext) {
        const [project, members, tags, board] = await Promise.all([
            // What the project says about itself. Without this the model cannot answer "what is
            // this project about" and falls back to describing what it was given instead.
            prisma.project.findUnique({
                where: { id: ctx.projectId },
                select: {
                    summary: true,
                    description: true,
                    githubRepoFullName: true,
                    planMd: true,
                },
            }),
            prisma.projectMember.findMany({
                where: { projectId: ctx.projectId },
                select: { role: true, user: { select: { id: true, name: true, email: true } } },
            }),
            prisma.tag.findMany({
                where: { projectId: ctx.projectId },
                select: { id: true, name: true, color: true },
            }),
            BoardIssueService.get_board_metadata(ctx.projectId, ctx.userId),
        ]);

        return {
            output: {
                project: {
                    id: ctx.projectId,
                    name: ctx.projectName,
                    // Rich text, same as an issue body — the raw HTML would be read out verbatim.
                    summary: as_text(project?.summary),
                    description: as_text(project?.description),
                    repo: project?.githubRepoFullName ?? null,
                    plan: project?.planMd
                        ? truncate(issue_display_text(project.planMd), PLAN_MAX_CHARS)
                        : null,
                },
                you: { id: ctx.userId, name: ctx.userName, role: ctx.role },
                members: members.map((member) => ({
                    id: member.user.id,
                    name: member.user.name ?? member.user.email,
                    role: member.role,
                })),
                tags,
                spaces: board.spaces.map((space) => ({ id: space.id, name: space.name })),
                // The space name rides along so the model can match "put it on the Design board"
                // without having to join columns to spaces itself.
                columns: board.columns.map((column) => ({
                    id: column.id,
                    label: column.label,
                    space: board.spaces.find((space) => space.id === column.spaceId)?.name ?? null,
                })),
                totals: board.totals.system,
            },
            resource: () => ({
                kind: "project",
                name: ctx.projectName,
                summary: as_text(project?.summary) ?? as_text(project?.description),
                repo: project?.githubRepoFullName ?? null,
                members: members.map((member) => ({
                    id: member.user.id,
                    name: member.user.name ?? member.user.email,
                    role: member.role,
                })),
                tags: tags.map((tag) => ({ id: tag.id, name: tag.name, color: tag.color })),
                boards: board.spaces.map((space) => ({
                    id: space.id,
                    name: space.name,
                    columns: board.columns
                        .filter((column) => column.spaceId === space.id)
                        .map((column) => column.label),
                })),
                totals: board.totals.system,
            }),
        };
    },
};

export default get_project_context_tool;
