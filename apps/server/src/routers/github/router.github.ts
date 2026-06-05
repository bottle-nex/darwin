import { Router } from "express";
import { requireAuth } from "../../middlewares/middleware.auth";
import ConnectStartController from "../../controllers/github/controller.connect_start";
import ConnectCompleteController from "../../controllers/github/controller.connect_complete";
import ListReposController from "../../controllers/github/controller.list_repos";
import DisconnectController from "../../controllers/github/controller.disconnect";

const github_router: Router = Router();

github_router.post("/connect/start", requireAuth, ConnectStartController.process);
github_router.post("/connect/complete", requireAuth, ConnectCompleteController.process);
github_router.get("/installations/:orgId/repos", requireAuth, ListReposController.process);
github_router.delete("/connect/:orgId", requireAuth, DisconnectController.process);

export default github_router;
