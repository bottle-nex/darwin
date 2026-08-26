import { prisma } from "@trymatcha/database";
import { SidebarTheme } from "@trymatcha/types";
import type { Request, Response } from "express";
import { z } from "zod";

import ResponseWriter from "../../services/service.response";

const body_schema = z.object({
    sidebarTheme: z.enum(Object.values(SidebarTheme) as [SidebarTheme, ...SidebarTheme[]]),
});

export default class SetSidebarThemeController {
    static async process(req: Request, res: Response) {
        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "invalid_data");
        }

        try {
            const userId = req.user.id;

            await prisma.user.update({
                where: { id: userId },
                data: { sidebarTheme: parsed.data.sidebarTheme },
            });

            return ResponseWriter.success(res, null, "Sidebar theme updated");
        } catch (error) {
            console.error("error in set sidebar theme controller", error);
            return ResponseWriter.system_error(res);
        }
    }
}
