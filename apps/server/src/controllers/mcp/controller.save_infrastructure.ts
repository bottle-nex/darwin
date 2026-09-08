import { prisma } from "@trydarwin/database";
import type { Request, Response } from "express";
import { z } from "zod";

import ResponseWriter from "../../services/service.response";

const body_schema = z.object({
    md: z.string().min(1),
});

export default class SaveSandboxInfrastructure {
    static async process(req: Request, res: Response) {
        try {
            const session_id = req.sandbox_session_id;
            if (!session_id) {
                ResponseWriter.not_authorized(res);
                return;
            }

            const { data, success } = body_schema.safeParse(req.body);
            if (!success) {
                ResponseWriter.invalid_data(res);
                return;
            }

            await prisma.setupSession.update({
                where: { id: session_id },
                data: { infrastructureMd: data.md },
            });

            ResponseWriter.success(res, null, "infrastructure saved");
        } catch (error) {
            console.error("error in saving sandbox infrastructure: ", error);
            ResponseWriter.system_error(res);
            return;
        }
    }
}
