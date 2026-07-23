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
import list_tags_controller from "../../controllers/project/controller.list_tags";
import create_tag_controller from "../../controllers/project/controller.create_tag";
import update_tag_controller from "../../controllers/project/controller.update_tag";
import delete_tag_controller from "../../controllers/project/controller.delete_tag";
import list_templates_controller from "../../controllers/project/controller.list_templates";
import create_template_controller from "../../controllers/project/controller.create_template";
import update_template_controller from "../../controllers/project/controller.update_template";
import delete_template_controller from "../../controllers/project/controller.delete_template";
import get_project_config_controller from "../../controllers/project/controller.get_project_config";
import update_project_config_controller from "../../controllers/project/controller.update_project_config";
import start_setup from "../../controllers/setup/controller.start_setup";

const project_router: Router = Router();

project_router.post("/create", require_auth, create_project_controller);
project_router.patch("/update", require_auth, update_project_controller);
project_router.delete("/delete", require_auth, delete_project_controller);
project_router.get("/:project_id", require_auth, get_project_controller);
project_router.get("/:project_id/members", require_auth, list_members_controller);
project_router.post("/:project_id/setup", require_auth, start_setup);
project_router.get("/:project_id/config", require_auth, get_project_config_controller);
project_router.patch("/:project_id/config", require_auth, update_project_config_controller);
project_router.get("/:project_id/secrets", require_auth, list_secrets_controller);
project_router.post("/:project_id/secrets", require_auth, set_secrets_controller);
project_router.delete("/:project_id/secrets/:key", require_auth, delete_secret_controller);
project_router.get("/:project_id/tags", require_auth, list_tags_controller);
project_router.post("/:project_id/tags", require_auth, create_tag_controller);
project_router.patch("/:project_id/tags/:tag_id", require_auth, update_tag_controller);
project_router.delete("/:project_id/tags/:tag_id", require_auth, delete_tag_controller);
project_router.get("/:project_id/templates", require_auth, list_templates_controller);
project_router.post("/:project_id/templates", require_auth, create_template_controller);
project_router.patch(
    "/:project_id/templates/:template_id",
    require_auth,
    update_template_controller,
);
project_router.delete(
    "/:project_id/templates/:template_id",
    require_auth,
    delete_template_controller,
);

export default project_router;
