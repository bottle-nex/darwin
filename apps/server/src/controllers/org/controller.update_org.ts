import { Request, Response } from "express";
import z from "zod";
import ResponseWriter from "../../services/service.response";
import { Prisma, prisma } from "@trymatcha/database";
import { Action, Permissions } from "@trymatcha/access-control";
import Access from "../../access-control/access";

const body_schema = z.object({
    id: z.string(),
    name: z.string().min(1),
    slug: z
        .string()
        .min(1)
        .max(50)
        .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
    description: z.string().optional(),
});

export default class UpdateOrgController {
    static async process(req: Request, res: Response) {
        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "invalid_data");
        }

        const { id, name, slug, description } = parsed.data;

        const role = await Access.org(req.user.id, id);
        if (!role || !Permissions.org(role, Action.org.update)) {
            return ResponseWriter.not_authorized(res);
        }

        try {
            await prisma.organization.update({
                where: { id },
                data: { name, slug, description },
            });

            ResponseWriter.success(res, {}, "Organization updated successfully!");
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === "P2002") {
                    return ResponseWriter.custom(
                        res,
                        false,
                        "SLUG_TAKEN",
                        "That slug is already taken.",
                        409,
                    );
                }
                if (error.code === "P2025") {
                    return ResponseWriter.not_found(res, "org not found");
                }
            }
            console.error("failed in UpdateOrgController", error);
            return ResponseWriter.system_error(res);
        }
    }
}
