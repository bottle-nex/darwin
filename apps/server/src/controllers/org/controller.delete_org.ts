import { Request, Response } from "express";
import z from "zod";
import ResponseWriter from "../../services/service.response";
import { prisma } from "@trymatcha/database";

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
            const existing_orgs = await prisma.organization.findMany({
                where: {
                    id: {
                        in: requested_ids,
                    },
                },
                select: {
                    id: true,
                },
            });

            const existing_ids = new Set(existing_orgs.map((org) => org.id));
            const invalid_ids = requested_ids.filter((id) => !existing_ids.has(id));

            await prisma.organization.deleteMany({
                where: {
                    id: {
                        in: [...existing_ids],
                    },
                },
            });

            return ResponseWriter.success(
                res,
                {
                    deleted: [...existing_ids],
                    failed: invalid_ids,
                },
                "organizations deleted",
            );
        } catch (error) {
            console.error("error in DeleteOrgController", error);
            ResponseWriter.system_error(res);
        }
    }
}
