import { Router } from "express";
import { requireAuth } from "../../middlewares/middleware.auth";
import GetPreloadPgController from "../../controllers/playground/get_preload_pg_controller";

const playground_router: Router = Router();

playground_router.get("/preload", requireAuth, GetPreloadPgController.process);

export default playground_router;
