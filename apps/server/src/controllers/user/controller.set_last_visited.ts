import { prisma } from "@trydarwin/database";
import type { Request, Response } from "express";
import { z } from "zod";

import ResponseWriter from "../../services/service.response";

const body_schema = z.object({
    orgSlug: z.string().min(1),
    projectSlug: z.string().min(1),
});

export default class SetLastVisitedController {
    static async process(req: Request, res: Response) {
        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "invalid_data");
        }

        try {
            const userId = req.user.id;
            const { orgSlug, projectSlug } = parsed.data;

            const org = await prisma.organization.findUnique({
                where: { slug: orgSlug },
                select: {
                    id: true,
                    members: { where: { userId }, select: { id: true } },
                    projects: { where: { slug: projectSlug }, select: { id: true } },
                },
            });

            if (!org || org.members.length === 0 || org.projects.length === 0) {
                return ResponseWriter.not_authorized(res, "Not a member of this org/project");
            }

            await prisma.user.update({
                where: { id: userId },
                data: {
                    lastVisitedOrgId: org.id,
                    lastVisitedProjectId: org.projects[0].id,
                },
            });

            return ResponseWriter.success(res, null, "Last visited updated");
        } catch (error) {
            console.error("error in set last visited controller", error);
            return ResponseWriter.system_error(res);
        }
    }
}
