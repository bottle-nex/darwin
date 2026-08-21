import { Router } from "express";
import { require_auth } from "../../middlewares/middleware.auth";
import ProjectChatGetController from "../../controllers/projectChat/controller.get_project_chats";
import TeamChatGetController from "../../controllers/projectChat/controller.get_team_chats";

const project_chats_router: Router = Router();

project_chats_router.get("/team/:teamId", require_auth, TeamChatGetController.process);
project_chats_router.get("/:projectId", require_auth, ProjectChatGetController.process);

export default project_chats_router;
