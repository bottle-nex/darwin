import { prisma } from "@trymatcha/database";
import { BackgroundLightingColor, DefaultHomeView } from "@trymatcha/types";
import type { Request, Response } from "express";
import { z } from "zod";

import ResponseWriter from "../../services/service.response";

const body_schema = z.object({
    backgroundLightingEnabled: z.boolean().optional(),
    backgroundLightingColor: z
        .enum(
            Object.values(BackgroundLightingColor) as [
                BackgroundLightingColor,
                ...BackgroundLightingColor[],
            ],
        )
        .optional(),
    defaultHomeView: z
        .enum(Object.values(DefaultHomeView) as [DefaultHomeView, ...DefaultHomeView[]])
        .optional(),
});

export default class UpdateUserConfigController {
    static async process(req: Request, res: Response) {
        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "Invalid data provided");
        }

        try {
            const userId = req.user.id;

            const config = await prisma.userConfig.upsert({
                where: { userId },
                create: { userId, ...parsed.data },
                update: parsed.data,
                select: {
                    backgroundLightingEnabled: true,
                    backgroundLightingColor: true,
                    defaultHomeView: true,
                },
            });

            return ResponseWriter.success(res, config, "Settings updated");
        } catch (error) {
            console.error("error in update user config controller", error);
            return ResponseWriter.system_error(res);
        }
    }
}
