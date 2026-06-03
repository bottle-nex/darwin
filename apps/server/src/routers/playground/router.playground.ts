import { Router } from "express";
import { requireAuth } from "../../middlewares/middleware.auth";
import GetPreloadPgController from "../../controllers/org/controller.get_orgs";

const playground_router: Router = Router();

playground_router.get("/preload", requireAuth, GetPreloadPgController.process);

export default playground_router;
