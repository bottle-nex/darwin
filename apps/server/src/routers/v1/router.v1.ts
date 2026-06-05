import { Router } from "express";
import auth_router from "../auth/router.auth";
import playground_router from "../playground/router.playground";
import org_router from "../org/router.org";
import teams_router from "../teams/router.teams";
import invitations_router from "../invitations/router.invitations";
import github_router from "../github/router.github";
import project_router from "../project/router.project";

const v1_router: Router = Router();

v1_router.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

v1_router.use("/auth", auth_router);
v1_router.use("/org", org_router);
v1_router.use("/teams", teams_router);
v1_router.use("/invitations", invitations_router);
v1_router.use("/playground", playground_router);
v1_router.use("/github", github_router);
v1_router.use("/project", project_router);

export default v1_router;
