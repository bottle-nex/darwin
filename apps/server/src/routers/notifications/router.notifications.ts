import { Router } from "express";
import { require_auth } from "../../middlewares/middleware.auth";
import ListMemberNotificationsController from "../../controllers/notifications/controller.list_member_notifications";
import ListProjectNotificationsController from "../../controllers/notifications/controller.list_project_notifications";
import MarkNotificationsReadController from "../../controllers/notifications/controller.mark_notifications_read";

const notifications_router: Router = Router();

notifications_router.get("/", require_auth, ListMemberNotificationsController.process);
notifications_router.get(
    "/project/:project_id",
    require_auth,
    ListProjectNotificationsController.process,
);
notifications_router.patch("/read", require_auth, MarkNotificationsReadController.process);

export default notifications_router;
