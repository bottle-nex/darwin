import { Router } from "express";
import { require_auth } from "../../middlewares/middleware.auth";
import ChatGetController from "../../controllers/chat/controller.get_chats";
import ListIssueThreadsController from "../../controllers/chat/controller.list_issue_threads";

// Chat writes go over the WebSocket (CHAT_CREATE in real-time/chat.handler.ts);
// HTTP only serves the history read.
const chats_router: Router = Router();

chats_router.get("/threads/:projectId", require_auth, ListIssueThreadsController.process);
chats_router.get("/:id", require_auth, ChatGetController.process);

export default chats_router;
