import { Router } from "express";
import { require_auth } from "../../middlewares/middleware.auth";
import ListNotificationsController from "../../controllers/notifications/controller.list_notifications";
import MarkNotificationsReadController from "../../controllers/notifications/controller.mark_notifications_read";

const notifications_router: Router = Router();

notifications_router.get("/", require_auth, ListNotificationsController.process);
notifications_router.patch("/read", require_auth, MarkNotificationsReadController.process);

export default notifications_router;
