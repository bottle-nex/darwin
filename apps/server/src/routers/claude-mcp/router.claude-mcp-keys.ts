import { Router } from "express";
import { require_auth } from "../../middlewares/middleware.auth";
import ApiKeyCreateController from "../../controllers/claude-mcp/controller.create_api_key";
import ApiKeyListController from "../../controllers/claude-mcp/controller.list_api_keys";
import ApiKeyRevokeController from "../../controllers/claude-mcp/controller.revoke_api_key";

const claude_mcp_keys_router: Router = Router();

claude_mcp_keys_router.post("/", require_auth, ApiKeyCreateController.process);
claude_mcp_keys_router.get("/", require_auth, ApiKeyListController.process);
claude_mcp_keys_router.delete("/:id", require_auth, ApiKeyRevokeController.process);

export default claude_mcp_keys_router;
