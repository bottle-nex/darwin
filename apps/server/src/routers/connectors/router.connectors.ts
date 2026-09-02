import { Router } from "express";

import ManageConnectorsController from "../../controllers/connectors/controller.manage";
import SlackCallbackController from "../../controllers/connectors/controller.slack_callback";
import SlackInboundController from "../../controllers/connectors/controller.slack_inbound";
import TelegramWebhookController from "../../controllers/connectors/controller.telegram_webhook";
import { require_auth } from "../../middlewares/middleware.auth";

const connectors_router: Router = Router();

connectors_router.post("/telegram/webhook", TelegramWebhookController.process);
connectors_router.get("/slack/callback", SlackCallbackController.process);
connectors_router.post("/slack/events", SlackInboundController.events);
connectors_router.post("/slack/interactions", SlackInboundController.interactions);

connectors_router.get("/", require_auth, ManageConnectorsController.list);
connectors_router.post("/:provider/link", require_auth, ManageConnectorsController.start);
connectors_router.delete("/:provider", require_auth, ManageConnectorsController.disconnect);

export default connectors_router;
