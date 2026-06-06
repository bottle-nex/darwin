import { Router } from "express";
import { require_auth } from "../../middlewares/middleware.auth";
import GetPreloadPgController from "../../controllers/org/controller.get_orgs";

const playground_router: Router = Router();

playground_router.get("/preload", require_auth, GetPreloadPgController.process);

export default playground_router;
