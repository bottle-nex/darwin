import type { Request, Response } from "express";
import z from "zod";

import ResponseWriter from "../../services/service.response";
import StorageService from "../../services/service.storage";
import { readable_run } from "./controller.get_run_logs";

const params_schema = z.object({
    run_id: z.string().min(1),
});

export default class RunLogsDownloadController {
    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user?.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data: params, success } = params_schema.safeParse(req.params);
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        try {
            const { session, allowed } = await readable_run(params.run_id, user.id);
            if (!session?.logsKey) {
                ResponseWriter.not_found(res, "Run logs are not archived");
                return;
            }
            if (!allowed) {
                ResponseWriter.not_authorized(res, "You dont have access to the project");
                return;
            }

            const url = await StorageService.signed_run_log_url(session.logsKey);
            ResponseWriter.redirect(res, url, "Run log download ready");
        } catch (error) {
            console.error("RunLogsDownloadController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
