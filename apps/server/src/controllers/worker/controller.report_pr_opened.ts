import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "@trymatcha/database";
import ResponseWriter from "../../services/service.response";

const body_schema = z.object({
    pr_url: z.string().min(1),
    branch: z.string().min(1),
    summary: z.string().min(1),
});

export default class ReportPrOpened {
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
                `[worker:${worker_id}] reporting PR opened -> ${data.pr_url} (branch: ${data.branch}, writing to db now)`,
            );

            await prisma.worker.update({
                where: { id: worker_id },
                data: {
                    contextSummary: {
                        lastPrUrl: data.pr_url,
                        lastBranch: data.branch,
                        lastSummary: data.summary,
                        reportedAt: new Date().toISOString(),
                    },
                },
            });

            console.log(`[worker:${worker_id}] PR outcome persisted`);

            ResponseWriter.success(res, null, "PR outcome recorded");
        } catch (error) {
            console.error("error in reporting PR opened: ", error);
            ResponseWriter.system_error(res);
            return;
        }
    }
}
