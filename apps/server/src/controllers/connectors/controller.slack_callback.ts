import { Provider } from "@trymatcha/database";
import type { Request, Response } from "express";

import { ENV } from "../../configs/env";
import { ConnectorLinkService } from "../../services/connectors";

export default class SlackCallbackController {
    static async process(req: Request, res: Response) {
        const settings_url = `${ENV.SERVER_WEB_URL}/playground`;

        try {
            const linked = await ConnectorLinkService.complete(Provider.Slack, req.query);
            res.redirect(`${settings_url}?slack=${linked ? "connected" : "failed"}`);
        } catch (error) {
            console.error("error in slack oauth callback: ", error);
            res.redirect(`${settings_url}?slack=failed`);
        }
    }
}
