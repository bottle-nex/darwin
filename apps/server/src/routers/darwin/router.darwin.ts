import { Router } from "express";

import DarwinCancelRunController from "../../controllers/darwin/controller.cancel_run";
import DarwinDeleteThreadController from "../../controllers/darwin/controller.delete_thread";
import DarwinGetThreadController from "../../controllers/darwin/controller.get_thread";
import DarwinListThreadsController from "../../controllers/darwin/controller.list_threads";
import DarwinRenameThreadController from "../../controllers/darwin/controller.rename_thread";
import DarwinSendMessageController from "../../controllers/darwin/controller.send_message";
import { require_auth } from "../../middlewares/middleware.auth";

// Answers stream over the WebSocket (DARWIN_RUN_SUBSCRIBE in real-time/socket.server.ts);
// HTTP only starts a run, stops one, and serves history.
const darwin_router: Router = Router();

darwin_router.post("/messages", require_auth, DarwinSendMessageController.process);
darwin_router.post("/runs/:run_id/cancel", require_auth, DarwinCancelRunController.process);
darwin_router.get("/threads/:project_id", require_auth, DarwinListThreadsController.process);
darwin_router.get(
    "/threads/:project_id/:thread_id",
    require_auth,
    DarwinGetThreadController.process,
);
darwin_router.patch(
    "/threads/:project_id/:thread_id",
    require_auth,
    DarwinRenameThreadController.process,
);
darwin_router.delete(
    "/threads/:project_id/:thread_id",
    require_auth,
    DarwinDeleteThreadController.process,
);

export default darwin_router;
