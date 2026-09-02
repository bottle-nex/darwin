import { Provider } from "@trymatcha/database";
import type { Request, Response } from "express";

import { ConnectorLinkService, ConnectorService } from "../../services/connectors";
import telegram_connector from "../../services/connectors/connector.telegram";

export default class TelegramWebhookController {
    static async process(req: Request, res: Response) {
        if (!telegram_connector.verify_request(req)) {
            res.sendStatus(401);
            return;
        }

        res.sendStatus(200);

        try {
            const linked = await ConnectorLinkService.complete(Provider.Telegram, req.body);
            if (linked) {
                await telegram_connector.send_linked_confirmation(linked.externalChatId);
                return;
            }

            const reply = telegram_connector.parse_reply(req.body);
            if (!reply) return;

            const callback_id = req.body?.callback_query?.id;
            if (callback_id) await telegram_connector.acknowledge(callback_id);

            await ConnectorService.accept_reply(Provider.Telegram, reply);
        } catch (error) {
            console.error("error in telegram webhook: ", error);
        }
    }
}
