import { prisma } from "@trymatcha/database";
import { Request, Response } from "express";
import ResponseWriter from "../../services/service.response";

export default class GetPreloadPgController {
    static async process(req: Request, res: Response) {
        try {
            const req_user = req.user;
            if (!req_user || !req_user.id) {
                ResponseWriter.not_authorized(res);
                return;
            }

            const memberships = await prisma.orgMember.findMany({
                where: {
                    userId: req_user.id,
                },
                select: {
                    role: true,
                    organization: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            description: true,
                            createdAt: true,
                            _count: {
                                select: {
                                    members: true,
                                    projects: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: "asc",
                },
            });

            const organizations = memberships.map((m) => ({
                id: m.organization.id,
                name: m.organization.name,
                slug: m.organization.slug,
                description: m.organization.description,
                createdAt: m.organization.createdAt,
                memberCount: m.organization._count.members,
                projectCount: m.organization._count.projects,
                role: m.role,
            }));

            ResponseWriter.success(res, {
                hasOrganization: organizations.length > 0,
                organizations,
            });
        } catch (err) {
            console.error("error in get preload pg controller : ", err);
            ResponseWriter.system_error(res);
        }
    }
}
