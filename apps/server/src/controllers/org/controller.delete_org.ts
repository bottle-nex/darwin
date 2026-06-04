import { Request, Response } from "express";
import z from "zod";
import ResponseWriter from "../../services/service.response";
import { prisma } from "@trymatcha/database";
import { Action, Permissions } from "@trymatcha/access-control";
import Access from "../../access-control/access";

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
            const requested_ids = [...new Set(parsed.data.ids)];

            const roles = await Promise.all(
                requested_ids.map((orgId) =>
                    Access.org(req.user.id, orgId).then((role) => ({ orgId, role })),
                ),
            );

            const authorized_ids = roles
                .filter(({ role }) => role && Permissions.org(role, Action.org.delete))
                .map(({ orgId }) => orgId);

            const unauthorized_ids = roles
                .filter(({ role }) => !role || !Permissions.org(role, Action.org.delete))
                .map(({ orgId }) => orgId);

            const existing_orgs = await prisma.organization.findMany({
                where: { id: { in: authorized_ids } },
                select: { id: true },
            });

            const existing_ids = new Set(existing_orgs.map((org) => org.id));
            const not_found_ids = authorized_ids.filter((id) => !existing_ids.has(id));

            await prisma.organization.deleteMany({
                where: { id: { in: [...existing_ids] } },
            });

            return ResponseWriter.success(
                res,
                {
                    deleted: [...existing_ids],
                    unauthorized: unauthorized_ids,
                    not_found: not_found_ids,
                },
                "organizations deleted",
            );
        } catch (error) {
            console.error("error in DeleteOrgController", error);
            ResponseWriter.system_error(res);
        }
    }
}
