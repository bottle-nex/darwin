import { Router } from "express";
import { require_auth } from "../../middlewares/middleware.auth";
import ChatCreateController from "../../controllers/chat/controller.create_chat";
import ChatGetController from "../../controllers/chat/controller.get_chats";

const chats_router: Router = Router();

chats_router.post("/:id", require_auth, ChatCreateController.process);
chats_router.get("/:id", require_auth, ChatGetController.process);

export default chats_router;
