import { Router } from "express";
import { require_auth } from "../../middlewares/middleware.auth";
import ListNotificationsController from "../../controllers/notifications/controller.list_notifications";

const notifications_router: Router = Router();

notifications_router.get("/", require_auth, ListNotificationsController.process);

export default notifications_router;
