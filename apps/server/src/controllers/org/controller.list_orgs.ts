import type { Request, Response } from "express";
import { prisma } from "@trymatcha/database";
import ResponseWriter from "../../services/service.response";

export default class ListOrgsController {
    /**
     * Handle `GET /org`: return the organizations the authenticated user belongs
     * to, shaped for the playground list (role + member/project counts).
     */
    static async process(req: Request, res: Response) {
        try {
            const userId = req.user.id;

            const memberships = await prisma.orgMember.findMany({
                where: { userId },
                select: {
                    role: true,
                    organization: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            description: true,
                            createdAt: true,
                            _count: { select: { members: true, projects: true } },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            });

            const organizations = memberships.map((m) => ({
                id: m.organization.id,
                name: m.organization.name,
                slug: m.organization.slug,
                description: m.organization.description,
                createdAt: m.organization.createdAt.toISOString(),
                memberCount: m.organization._count.members,
                projectCount: m.organization._count.projects,
                role: m.role,
            }));

            return ResponseWriter.success(res, organizations, "Organizations fetched");
        } catch (error) {
            console.error("error in list orgs controller", error);
            return ResponseWriter.system_error(res);
        }
    }
}
