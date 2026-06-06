import { Router } from "express";
import { require_auth } from "../../middlewares/middleware.auth";
import GetPreloadPgController from "../../controllers/org/controller.get_orgs";
import GetDashboardController from "../../controllers/playground/controller.get_dashboard";

const playground_router: Router = Router();

playground_router.get("/preload", require_auth, GetPreloadPgController.process);
playground_router.get("/dashboard/:org_slug", require_auth, GetDashboardController.process);

export default playground_router;
