import { Router } from "express";
import { require_auth } from "../../middlewares/middleware.auth";
import ChatGetController from "../../controllers/chat/controller.get_chats";

// Chat writes go over the WebSocket (CHAT_CREATE in real-time/chat.handler.ts);
// HTTP only serves the history read.
const chats_router: Router = Router();

chats_router.get("/:id", require_auth, ChatGetController.process);

export default chats_router;
