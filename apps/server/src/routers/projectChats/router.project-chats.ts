import { Router } from "express";

import ConversationPreviewsGetController from "../../controllers/projectChat/controller.get_conversation_previews";
import ProjectChatGetController from "../../controllers/projectChat/controller.get_project_chats";
import TeamChatGetController from "../../controllers/projectChat/controller.get_team_chats";
import { require_auth } from "../../middlewares/middleware.auth";

const project_chats_router: Router = Router();

project_chats_router.get(
    "/conversations/:projectId",
    require_auth,
    ConversationPreviewsGetController.process,
);
project_chats_router.get("/team/:teamId", require_auth, TeamChatGetController.process);
project_chats_router.get("/:projectId", require_auth, ProjectChatGetController.process);

export default project_chats_router;
