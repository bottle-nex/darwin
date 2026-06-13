import { Router } from "express";
import { require_auth } from "../../middlewares/middleware.auth";
import create_project_controller from "../../controllers/project/controller.create_project";
import get_project_controller from "../../controllers/project/controller.get_project";
import update_project_controller from "../../controllers/project/controller.update_project";
import delete_project_controller from "../../controllers/project/controller.delete_project";
import set_secrets_controller from "../../controllers/project/controller.set_secrets";
import list_secrets_controller from "../../controllers/project/controller.list_secrets";
import delete_secret_controller from "../../controllers/project/controller.delete_secret";
import list_members_controller from "../../controllers/project/controller.list_members";

const project_router: Router = Router();

project_router.post("/create", require_auth, create_project_controller);
project_router.patch("/update", require_auth, update_project_controller);
project_router.delete("/delete", require_auth, delete_project_controller);
project_router.get("/:project_id", require_auth, get_project_controller);
project_router.get("/:project_id/members", require_auth, list_members_controller);
project_router.get("/:project_id/secrets", require_auth, list_secrets_controller);
project_router.post("/:project_id/secrets", require_auth, set_secrets_controller);
project_router.delete("/:project_id/secrets/:key", require_auth, delete_secret_controller);

export default project_router;
