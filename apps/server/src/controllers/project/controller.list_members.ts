import { Request, Response } from "express";
import ResponseWriter from "../../services/service.response";
import { prisma } from "@trymatcha/database";
import Access from "../../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";

export default async function list_members_controller(req: Request, res: Response) {
    try {
        const user = req.user;
        if (!user || !user.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const project_id = req.params.project_id as string;
        if (!project_id) {
            ResponseWriter.not_found(res, "Project not found");
            return;
        }

        const role = await Access.project(user.id, project_id);
        if (!role || !Permissions.project(role, Action.project.read)) {
            ResponseWriter.not_authorized(res, "You don't have access to this project");
            return;
        }

        // `q` (even empty) signals a search-driven caller, e.g. an @-mention picker —
        // those get a capped, server-filtered batch instead of the full member list.
        const has_query = typeof req.query.q === "string";
        const query = has_query ? (req.query.q as string).trim() : "";

        const project_members = await prisma.projectMember.findMany({
            where: {
                projectId: project_id,
                ...(query && {
                    user: {
                        OR: [
                            { name: { contains: query, mode: "insensitive" } },
                            { email: { contains: query, mode: "insensitive" } },
                        ],
                    },
                }),
            },
            select: {
                id: true,
                role: true,
                user: { select: { id: true, name: true, email: true, image: true } },
            },
            orderBy: { createdAt: "asc" },
            ...(has_query && { take: 8 }),
        });

        const members = project_members.map((m) => ({
            id: m.user.id,
            memberId: m.id,
            name: m.user.name,
            email: m.user.email,
            image: m.user.image,
            role: m.role,
        }));

        ResponseWriter.success(res, { members });
    } catch (err) {
        console.error("list_members_controller failed: ", err);
        ResponseWriter.system_error(res);
    }
}
