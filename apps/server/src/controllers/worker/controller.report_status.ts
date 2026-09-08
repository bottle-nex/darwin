import { prisma, WorkerStatus } from "@trydarwin/database";
import type { Request, Response } from "express";
import { z } from "zod";

import ResponseWriter from "../../services/service.response";

const body_schema = z.object({
    status: z.enum(WorkerStatus),
});

export default class ReportWorkerStatus {
    static async process(req: Request, res: Response) {
        try {
            const worker_id = req.worker_id;
            if (!worker_id) {
                ResponseWriter.not_authorized(res);
                return;
            }

            const { data, success } = body_schema.safeParse(req.body);
            if (!success) {
                ResponseWriter.invalid_data(res);
                return;
            }

            console.log(
                `[worker:${worker_id}] reporting status -> ${data.status} (writing to db now)`,
            );

            await prisma.worker.update({
                where: { id: worker_id },
                data: { status: data.status },
            });

            console.log(`[worker:${worker_id}] status persisted as ${data.status}`);

            ResponseWriter.success(res, null, "status updated");
        } catch (error) {
            console.error("error in reporting worker status: ", error);
            ResponseWriter.system_error(res);
            return;
        }
    }
}
