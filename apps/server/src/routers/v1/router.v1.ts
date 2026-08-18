import { Router } from "express";
import auth_router from "../auth/router.auth";
import playground_router from "../playground/router.playground";
import org_router from "../org/router.org";
import user_router from "../user/router.user";
import teams_router from "../teams/router.teams";
import invitations_router from "../invitations/router.invitations";
import github_router from "../github/router.github";
import project_router from "../project/router.project";
import issues_router from "../issues/router.issues";
import chats_router from "../chats/router.chats";
import project_chats_router from "../projectChats/router.project-chats";
import notifications_router from "../notifications/router.notifications";
import mcp_router from "../mcp/router.mcp";
import worker_router from "../worker/router.worker";
import admin_router from "../admin/router.admin";
import content_router from "../content/router.content";

const v1_router: Router = Router();

v1_router.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

v1_router.use("/auth", auth_router);
v1_router.use("/org", org_router);
v1_router.use("/user", user_router);
v1_router.use("/project", project_router);
v1_router.use("/teams", teams_router);
v1_router.use("/invitations", invitations_router);
v1_router.use("/playground", playground_router);
v1_router.use("/github", github_router);
v1_router.use("/issues", issues_router);
v1_router.use("/chats", chats_router);
v1_router.use("/project-chats", project_chats_router);
v1_router.use("/notifications", notifications_router);
v1_router.use("/setup", mcp_router);
v1_router.use("/worker", worker_router);
v1_router.use("/admin", admin_router);
v1_router.use("/content", content_router);

export default v1_router;
