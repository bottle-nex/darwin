import { OrgRole, Prisma, prisma } from "@trymatcha/database";
import type { Request, Response } from "express";
import { z } from "zod";

import ResponseWriter from "../../services/service.response";

const body_schema = z.object({
    name: z.string().min(1),
    slug: z
        .string()
        .min(1)
        .max(50)
        .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
    description: z.string().optional(),
});
export default class CreateOrgController {
    static async process(req: Request, res: Response) {
        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "invalid_data");
        }

        try {
            const data = parsed.data;
            const userId = req.user.id;

            const orgId = await prisma.organization.create({
                data: {
                    name: data.name,
                    slug: data.slug,
                    description: data.description,
                    createdById: userId,
                    members: {
                        create: {
                            userId: userId,
                            role: OrgRole.Owner,
                        },
                    },
                },
                select: {
                    id: true,
                },
            });

            ResponseWriter.created(res, orgId, "Organization created successfully.");
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
                return ResponseWriter.custom(
                    res,
                    false,
                    "SLUG_TAKEN",
                    "That slug is already taken.",
                    409,
                );
            }
            console.error("error in create org controller", error);
            ResponseWriter.system_error(res);
        }
    }
}
