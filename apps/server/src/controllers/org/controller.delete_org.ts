import { Request, Response } from "express";
import z from "zod";
import ResponseWriter from "../../services/service.response";
import { prisma } from "@trymatcha/database";
import Permissions from "../../access-control/permissions";
import Action from "../../access-control/actions";

const body_schema = z.object({
    ids: z.array(z.string()).min(1).max(100),
});

export default class DeleteOrgController {
    static async process(req: Request, res: Response) {
        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "ids must be an non-empty array");
        }

        try {
            const userId = req.user.id;
            const requested_ids = [...new Set(parsed.data.ids)];

            const existing_orgs = await prisma.organization.findMany({
                where: { id: { in: requested_ids } },
                select: { id: true },
            });
            const existing_ids = new Set(existing_orgs.map((org) => org.id));
            const not_found = requested_ids.filter((id) => !existing_ids.has(id));

            // Resolve the caller's role in every requested org in one query, then keep
            // only the orgs they actually have delete permission on.
            const memberships = await prisma.orgMember.findMany({
                where: { userId, orgId: { in: [...existing_ids] } },
                select: { orgId: true, role: true },
            });
            const role_by_org = new Map(memberships.map((m) => [m.orgId, m.role]));

            const deletable: string[] = [];
            const forbidden: string[] = [];
            for (const id of existing_ids) {
                const role = role_by_org.get(id);
                if (role && Permissions.org(role, Action.org.delete)) {
                    deletable.push(id);
                } else {
                    forbidden.push(id);
                }
            }

            if (deletable.length > 0) {
                await prisma.organization.deleteMany({
                    where: { id: { in: deletable } },
                });
            }

            return ResponseWriter.success(
                res,
                { deleted: deletable, forbidden, notFound: not_found },
                "organizations deleted",
            );
        } catch (error) {
            console.error("error in DeleteOrgController", error);
            ResponseWriter.system_error(res);
        }
    }
}
