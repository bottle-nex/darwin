import { Router } from "express";

import claude_mcp_router from "../../claude-mcp/router.claude-mcp";
import admin_router from "../admin/router.admin";
import auth_router from "../auth/router.auth";
import chats_router from "../chats/router.chats";
import claude_mcp_keys_router from "../claude-mcp/router.claude-mcp-keys";
import connectors_router from "../connectors/router.connectors";
import content_router from "../content/router.content";
import darwin_router from "../darwin/router.darwin";
import github_router from "../github/router.github";
import invitations_router from "../invitations/router.invitations";
import issues_router from "../issues/router.issues";
import mcp_router from "../mcp/router.mcp";
import notifications_router from "../notifications/router.notifications";
import org_router from "../org/router.org";
import playground_router from "../playground/router.playground";
import project_router from "../project/router.project";
import project_chats_router from "../projectChats/router.project-chats";
import questions_router from "../questions/router.questions";
import search_router from "../search/router.search";
import teams_router from "../teams/router.teams";
import uploads_router from "../uploads/router.uploads";
import user_router from "../user/router.user";
import worker_router from "../worker/router.worker";

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
v1_router.use("/search", search_router);
v1_router.use("/setup", mcp_router);
v1_router.use("/connectors", connectors_router);
v1_router.use("/questions", questions_router);
v1_router.use("/claude-mcp/api-keys", claude_mcp_keys_router);
v1_router.use("/claude-mcp/mcp", claude_mcp_router);
v1_router.use("/worker", worker_router);
v1_router.use("/admin", admin_router);
v1_router.use("/content", content_router);
v1_router.use("/darwin", darwin_router);
v1_router.use("/uploads", uploads_router);

export default v1_router;
