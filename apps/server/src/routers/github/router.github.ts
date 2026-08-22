import { Router } from "express";
import { require_auth } from "../../middlewares/middleware.auth";
import ConnectStartController from "../../controllers/github/controller.connect_start";
import ConnectCompleteController from "../../controllers/github/controller.connect_complete";
import ListReposController from "../../controllers/github/controller.list_repos";
import ListBranchesController from "../../controllers/github/controller.list_branches";
import DisconnectController from "../../controllers/github/controller.disconnect";
import GithubLinkController from "../../controllers/github/controller.link";

const github_router: Router = Router();

github_router.post("/connect/start", require_auth, ConnectStartController.process);
github_router.post("/connect/complete", require_auth, ConnectCompleteController.process);
github_router.get("/link", require_auth, GithubLinkController.status);
github_router.post("/link/start", require_auth, GithubLinkController.start);
github_router.post("/link/complete", require_auth, GithubLinkController.complete);
github_router.delete("/link", require_auth, GithubLinkController.unlink);
github_router.get("/installations/:orgId/repos", require_auth, ListReposController.process);
github_router.get(
    "/installations/:orgId/repos/:owner/:repo/branches",
    require_auth,
    ListBranchesController.process,
);
github_router.delete("/connect/:orgId", require_auth, DisconnectController.process);

export default github_router;
