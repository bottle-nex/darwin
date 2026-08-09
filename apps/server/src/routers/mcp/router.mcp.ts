import { Router } from "express";
import { require_sandbox_auth } from "../../middlewares/middleware.sandbox_auth";
import UpdateSandboxStatusController from "../../controllers/mcp/controller.update_sandbox_status";
import AskSandboxQuestionController from "../../controllers/mcp/controller.ask_sandbox_question";
import GetSandboxAnswerController from "../../controllers/mcp/controller.get_sandbox_answer";
import SaveSandboxInfrastructureController from "../../controllers/mcp/controller.save_infrastructure";

const mcp_router: Router = Router();

mcp_router.post("/sandbox/status", require_sandbox_auth, UpdateSandboxStatusController.process);
mcp_router.post("/sandbox/ask", require_sandbox_auth, AskSandboxQuestionController.process);
mcp_router.get("/sandbox/answer", require_sandbox_auth, GetSandboxAnswerController.process);
mcp_router.post(
    "/sandbox/infrastructure",
    require_sandbox_auth,
    SaveSandboxInfrastructureController.process,
);

export default mcp_router;
