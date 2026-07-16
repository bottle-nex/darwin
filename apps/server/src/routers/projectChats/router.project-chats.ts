import { Router } from "express";
import { require_auth } from "../../middlewares/middleware.auth";
import ProjectChatGetController from "../../controllers/projectChat/controller.get_project_chats";

// Project-chat writes go over the WebSocket (PROJECT_CHAT_CREATE in
// real-time/project-chat.handler.ts); HTTP only serves the history read.
const project_chats_router: Router = Router();

project_chats_router.get("/:projectId", require_auth, ProjectChatGetController.process);

export default project_chats_router;
