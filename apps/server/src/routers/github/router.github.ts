import { Router } from "express";
import { require_auth } from "../../middlewares/middleware.auth";
import ConnectStartController from "../../controllers/github/controller.connect_start";
import ConnectCompleteController from "../../controllers/github/controller.connect_complete";
import ListReposController from "../../controllers/github/controller.list_repos";
import ListBranchesController from "../../controllers/github/controller.list_branches";
import DisconnectController from "../../controllers/github/controller.disconnect";

const github_router: Router = Router();

github_router.post("/connect/start", require_auth, ConnectStartController.process);
github_router.post("/connect/complete", require_auth, ConnectCompleteController.process);
github_router.get("/installations/:orgId/repos", require_auth, ListReposController.process);
github_router.get(
    "/installations/:orgId/repos/:owner/:repo/branches",
    require_auth,
    ListBranchesController.process,
);
github_router.delete("/connect/:orgId", require_auth, DisconnectController.process);

export default github_router;
