import { Provider } from "@trydarwin/database";
import type { Request, Response } from "express";
import { z } from "zod";

import { ConnectorLinkService } from "../../services/connectors";
import ResponseWriter from "../../services/service.response";

const provider_schema = z.object({ provider: z.enum(Provider) });

export default class ManageConnectorsController {
    static async list(req: Request, res: Response) {
        try {
            const connectors = await ConnectorLinkService.list(req.user.id);
            return ResponseWriter.success(res, connectors);
        } catch (error) {
            console.error("error in listing connectors: ", error);
            return ResponseWriter.system_error(res);
        }
    }

    static async start(req: Request, res: Response) {
        const parsed = provider_schema.safeParse(req.params);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "unknown connector provider");
        }

        try {
            const url = await ConnectorLinkService.start(req.user.id, parsed.data.provider);
            if (!url) {
                return ResponseWriter.custom(
                    res,
                    false,
                    "CONNECTOR_UNAVAILABLE",
                    "This connector is not configured on the server.",
                    503,
                );
            }

            return ResponseWriter.success(res, { url });
        } catch (error) {
            console.error("error in starting connector link: ", error);
            return ResponseWriter.system_error(res);
        }
    }

    static async disconnect(req: Request, res: Response) {
        const parsed = provider_schema.safeParse(req.params);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "unknown connector provider");
        }

        try {
            await ConnectorLinkService.disconnect(req.user.id, parsed.data.provider);
            return ResponseWriter.success(res, null, "Connector disconnected.");
        } catch (error) {
            console.error("error in disconnecting connector: ", error);
            return ResponseWriter.system_error(res);
        }
    }
}
