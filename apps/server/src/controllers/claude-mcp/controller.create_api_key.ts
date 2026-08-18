import { Request, Response } from "express";
import z from "zod";
import { prisma } from "@trymatcha/database";
import ResponseWriter from "../../services/service.response";
import ApiKeyService from "../../services/service.api_key";

export default class ApiKeyCreateController {
    static body_schema = z.object({
        label: z.string().min(1).max(60),
    });

    static async process(req: Request, res: Response) {
        try {
            const user = req.user;
            if (!user || !user.id) {
                ResponseWriter.not_authorized(res);
                return;
            }

            const parsed_body = ApiKeyCreateController.body_schema.safeParse(req.body);
            if (!parsed_body.success) {
                ResponseWriter.invalid_data(res, "Invalid api key data provided");
                return;
            }

            const { raw, prefix } = ApiKeyService.generate_key();
            const hashed_key = await ApiKeyService.hash_key(raw);

            const api_key = await prisma.apiKey.create({
                data: {
                    userId: user.id,
                    label: parsed_body.data.label,
                    prefix,
                    hashedKey: hashed_key,
                },
                select: {
                    id: true,
                    label: true,
                    prefix: true,
                    createdAt: true,
                },
            });

            ResponseWriter.created(
                res,
                { api_key: { ...api_key, key: raw } },
                "Api key created successfully",
            );
        } catch (err) {
            console.log("[claude-mcp:create_api_key] error while creating api key", err);
            ResponseWriter.system_error(res);
        }
    }
}
