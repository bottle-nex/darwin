import { Action, Permissions } from "@trymatcha/access-control";
import { prisma } from "@trymatcha/database";
import { BackgroundLightingColor, DefaultHomeView } from "@trymatcha/types";
import type { Request, Response } from "express";
import z from "zod";

import ResponseWriter from "../../services/service.response";

const params_schema = z.object({
    org_slug: z.string().min(1),
});

const DEFAULT_USER_CONFIG = {
    backgroundLightingEnabled: true,
    backgroundLightingColor: BackgroundLightingColor.Violet,
    defaultHomeView: DefaultHomeView.Kanban,
};

export default class GetDashboardController {
    static async process(req: Request, res: Response) {
        try {
            const parsed = params_schema.safeParse(req.params);
            if (!parsed.success) {
                ResponseWriter.invalid_data(res, "Invalid org slug");
                return;
            }

            const { org_slug } = parsed.data;
            const user_id = req.user.id;

            const membership = await prisma.orgMember.findFirst({
                where: { userId: user_id, organization: { slug: org_slug } },
                select: {
                    role: true,
                    organization: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            description: true,
                            createdAt: true,
                        },
                    },
                },
            });

            if (!membership) {
                ResponseWriter.not_found(res, "Organization not found");
                return;
            }

            if (!Permissions.org(membership.role, Action.org.read)) {
                ResponseWriter.not_authorized(res, "You don't have access to this org");
                return;
            }

            const projects = await prisma.project.findMany({
                where: { orgId: membership.organization.id },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    icon: true,
                    githubRepoFullName: true,
                    githubRepoUrl: true,
                    githubDefaultBranch: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
            });

            const config = await prisma.userConfig.findUnique({
                where: { userId: user_id },
                select: {
                    backgroundLightingEnabled: true,
                    backgroundLightingColor: true,
                    defaultHomeView: true,
                },
            });

            ResponseWriter.success(res, {
                org: membership.organization,
                projects,
                userConfig: config ?? DEFAULT_USER_CONFIG,
            });
        } catch (error) {
            console.error("error in get_dashboard controller:", error);
            ResponseWriter.system_error(res);
        }
    }
}
