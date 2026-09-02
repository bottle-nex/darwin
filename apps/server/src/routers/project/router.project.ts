import { Router } from "express";

import change_project_role_controller from "../../controllers/project/controller.change_project_role";
import close_review_controller from "../../controllers/project/controller.close_review";
import create_project_controller from "../../controllers/project/controller.create_project";
import create_review_comment_controller from "../../controllers/project/controller.create_review_comment";
import create_tag_controller from "../../controllers/project/controller.create_tag";
import create_template_controller from "../../controllers/project/controller.create_template";
import delete_project_controller from "../../controllers/project/controller.delete_project";
import delete_review_comment_controller from "../../controllers/project/controller.delete_review_comment";
import delete_secret_controller from "../../controllers/project/controller.delete_secret";
import delete_tag_controller from "../../controllers/project/controller.delete_tag";
import delete_template_controller from "../../controllers/project/controller.delete_template";
import get_issue_import_controller from "../../controllers/project/controller.get_issue_import";
import get_product_diff_controller from "../../controllers/project/controller.get_product_diff";
import get_project_controller from "../../controllers/project/controller.get_project";
import get_project_config_controller from "../../controllers/project/controller.get_project_config";
import get_review_controller from "../../controllers/project/controller.get_review";
import get_review_file_controller from "../../controllers/project/controller.get_review_file";
import list_members_controller from "../../controllers/project/controller.list_members";
import list_presence_controller from "../../controllers/project/controller.list_presence";
import list_product_diffs_controller from "../../controllers/project/controller.list_product_diffs";
import list_review_comments_controller from "../../controllers/project/controller.list_review_comments";
import list_review_files_controller from "../../controllers/project/controller.list_review_files";
import list_secrets_controller from "../../controllers/project/controller.list_secrets";
import list_tags_controller from "../../controllers/project/controller.list_tags";
import list_templates_controller from "../../controllers/project/controller.list_templates";
import merge_review_controller from "../../controllers/project/controller.merge_review";
import product_diff_artifact_urls_controller from "../../controllers/project/controller.product_diff_artifact_urls";
import regenerate_product_diff_controller from "../../controllers/project/controller.regenerate_product_diff";
import set_secrets_controller from "../../controllers/project/controller.set_secrets";
import update_issue_import_controller from "../../controllers/project/controller.update_issue_import";
import update_project_controller from "../../controllers/project/controller.update_project";
import update_project_config_controller from "../../controllers/project/controller.update_project_config";
import update_review_comment_controller from "../../controllers/project/controller.update_review_comment";
import update_tag_controller from "../../controllers/project/controller.update_tag";
import update_template_controller from "../../controllers/project/controller.update_template";
import start_setup from "../../controllers/setup/controller.start_setup";
import { require_auth } from "../../middlewares/middleware.auth";

const project_router: Router = Router();

project_router.post("/create", require_auth, create_project_controller);
project_router.patch("/update", require_auth, update_project_controller);
project_router.delete("/delete", require_auth, delete_project_controller);
project_router.get("/:project_id", require_auth, get_project_controller);
project_router.get("/:project_id/members", require_auth, list_members_controller);
project_router.patch("/:project_id/members/role", require_auth, change_project_role_controller);
project_router.get("/:project_id/presence", require_auth, list_presence_controller);
project_router.post("/:project_id/setup", require_auth, start_setup);
project_router.get("/:project_id/config", require_auth, get_project_config_controller);
project_router.patch("/:project_id/config", require_auth, update_project_config_controller);
project_router.get("/:project_id/product-diffs", require_auth, list_product_diffs_controller);
project_router.get(
    "/:project_id/product-diffs/:product_diff_id",
    require_auth,
    get_product_diff_controller,
);
project_router.post(
    "/:project_id/product-diffs/:product_diff_id/artifact-urls",
    require_auth,
    product_diff_artifact_urls_controller,
);
project_router.post(
    "/:project_id/product-diffs/:issue_id/regenerate",
    require_auth,
    regenerate_product_diff_controller,
);
project_router.get("/:project_id/review/:pull_number", require_auth, get_review_controller);
project_router.get(
    "/:project_id/review/:pull_number/files",
    require_auth,
    list_review_files_controller,
);
project_router.get(
    "/:project_id/review/:pull_number/file",
    require_auth,
    get_review_file_controller,
);
project_router.get(
    "/:project_id/review/:pull_number/comments",
    require_auth,
    list_review_comments_controller,
);
project_router.post(
    "/:project_id/review/:pull_number/comments",
    require_auth,
    create_review_comment_controller,
);
project_router.patch(
    "/:project_id/review/:pull_number/comments/:comment_id",
    require_auth,
    update_review_comment_controller,
);
project_router.delete(
    "/:project_id/review/:pull_number/comments/:comment_id",
    require_auth,
    delete_review_comment_controller,
);
project_router.post(
    "/:project_id/review/:pull_number/merge",
    require_auth,
    merge_review_controller,
);
project_router.post(
    "/:project_id/review/:pull_number/close",
    require_auth,
    close_review_controller,
);
project_router.get("/:project_id/secrets", require_auth, list_secrets_controller);
project_router.post("/:project_id/secrets", require_auth, set_secrets_controller);
project_router.delete("/:project_id/secrets/:key", require_auth, delete_secret_controller);
project_router.get("/:project_id/tags", require_auth, list_tags_controller);
project_router.get("/:project_id/issue-import", require_auth, get_issue_import_controller);
project_router.patch("/:project_id/issue-import", require_auth, update_issue_import_controller);
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
