import { Provider } from "@trydarwin/database";
import type { Request, Response } from "express";

import { ConnectorService } from "../../services/connectors";
import slack_connector from "../../services/connectors/connector.slack";

type SlackPayload = { type?: string; challenge?: string };

export default class SlackInboundController {
    static async events(req: Request, res: Response) {
        if (!slack_connector.verify_request(req)) {
            res.sendStatus(401);
            return;
        }

        const payload = SlackInboundController.read_json(req);
        if (payload?.type === "url_verification") {
            res.json({ challenge: (payload as { challenge: string }).challenge });
            return;
        }

        res.sendStatus(200);
        await SlackInboundController.accept(payload);
    }

    static async interactions(req: Request, res: Response) {
        if (!slack_connector.verify_request(req)) {
            res.sendStatus(401);
            return;
        }

        res.sendStatus(200);

        const raw = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";
        const encoded = new URLSearchParams(raw).get("payload");
        if (!encoded) return;

        try {
            await SlackInboundController.accept(JSON.parse(encoded));
        } catch (error) {
            console.error("error parsing slack interaction payload: ", error);
        }
    }

    private static read_json(req: Request): SlackPayload | null {
        try {
            const raw = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";
            return JSON.parse(raw) as SlackPayload;
        } catch {
            return null;
        }
    }

    private static async accept(payload: unknown) {
        if (!payload) return;

        try {
            const reply = slack_connector.parse_reply(payload);
            if (!reply) return;

            await ConnectorService.accept_reply(Provider.Slack, reply);
        } catch (error) {
            console.error("error handling slack inbound: ", error);
        }
    }
}
