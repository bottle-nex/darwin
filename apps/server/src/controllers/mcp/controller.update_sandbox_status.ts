import { Request, Response } from "express";
import { z } from "zod";
import { prisma, SetupStatus } from "@trymatcha/database";
import ResponseWriter from "../../services/service.response";

const body_schema = z.object({
    status: z.enum(SetupStatus),
});

export default class UpdateSandboxStatus {
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
                data: { status: data.status },
            });

            ResponseWriter.success(res, null, "status updated");
        } catch (error) {
            console.error("error in updating sandbox status: ", error);
            ResponseWriter.system_error(res);
            return;
        }
    }
}
