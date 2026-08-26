import { Router } from "express";

import GetLastVisitedController from "../../controllers/user/controller.get_last_visited";
import GetSidebarThemeController from "../../controllers/user/controller.get_sidebar_theme";
import SetLastVisitedController from "../../controllers/user/controller.set_last_visited";
import SetSidebarThemeController from "../../controllers/user/controller.set_sidebar_theme";
import UpdateUserConfigController from "../../controllers/user/controller.update_user_config";
import { require_auth } from "../../middlewares/middleware.auth";

const user_router: Router = Router();

user_router.get("/last-visited", require_auth, GetLastVisitedController.process);
user_router.patch("/last-visited", require_auth, SetLastVisitedController.process);
user_router.get("/sidebar-theme", require_auth, GetSidebarThemeController.process);
user_router.patch("/sidebar-theme", require_auth, SetSidebarThemeController.process);
user_router.patch("/config", require_auth, UpdateUserConfigController.process);

export default user_router;
