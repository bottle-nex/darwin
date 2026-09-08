import { Action } from "@trydarwin/access-control";
import { prisma } from "@trydarwin/database";
import type { DarwinMemberCard } from "@trydarwin/types";
import z from "zod";

import type { DarwinContext, DarwinTool } from "./tool.registry";

/** A team is a short list; past this the card would scroll further than anyone reads. */
const MAX_CARD_MEMBERS = 40;

const input = z.object({}).strict();

/**
 * Who is on this project.
 *
 * Separate from `get_project_context` even though that tool also loads members: a question about
 * people is answered by people, not by a project panel with a row of faceless avatars. This is the
 * tool whose card *is* the answer, which is the test every presenting tool has to pass.
 *
 * @example
 * await list_members_tool.run({}, ctx);
 * // { total: 2, members: [{ id: "cku…", name: "Rishi Kant", role: "Admin", isYou: true }] }
 */
const list_members_tool: DarwinTool<typeof input> = {
    name: "list_members",
    description:
        "Read the people on this project — who they are and what each of them is allowed to do. " +
        "Use it whenever the user asks who is on the project, who someone is, or who work can be " +
        "given to.",
    input,
    readOnly: true,
    action: Action.project.read,

    async run(_args, ctx: DarwinContext) {
        const members = await prisma.projectMember.findMany({
            where: { projectId: ctx.projectId },
            orderBy: { createdAt: "asc" },
            select: {
                role: true,
                user: { select: { id: true, name: true, email: true, image: true } },
            },
        });

        return {
            output: {
                total: members.length,
                members: members.map((member) => ({
                    id: member.user.id,
                    name: member.user.name ?? member.user.email,
                    role: member.role,
                    isYou: member.user.id === ctx.userId,
                })),
            },
            resource: () => ({
                kind: "members",
                total: members.length,
                items: members.slice(0, MAX_CARD_MEMBERS).map((member): DarwinMemberCard => ({
                    id: member.user.id,
                    name: member.user.name,
                    email: member.user.email,
                    image: member.user.image,
                    role: member.role,
                    isViewer: member.user.id === ctx.userId,
                })),
            }),
        };
    },
};

export default list_members_tool;
