import { Router } from "express";

import IssueAssignController from "../../controllers/issues/controller.assign_issue";
import IssueBulkDeleteController from "../../controllers/issues/controller.bulk_delete_issues";
import IssueBulkUpdateController from "../../controllers/issues/controller.bulk_update_issues";
import ColumnCreateController from "../../controllers/issues/controller.create_column";
import IssueCreateController from "../../controllers/issues/controller.create_issues";
import ColumnDeleteController from "../../controllers/issues/controller.delete_column";
import IssueDeleteController from "../../controllers/issues/controller.delete_issue";
import BoardColumnsGetController from "../../controllers/issues/controller.get_board_columns";
import IssueGetByIdController from "../../controllers/issues/controller.get_issue";
import IssueReferencesGetController from "../../controllers/issues/controller.get_issue_references";
import IssueGetController from "../../controllers/issues/controller.get_issues";
import IssueActivityListController from "../../controllers/issues/controller.list_activity";
import MyIssuesListController from "../../controllers/issues/controller.list_my_issues";
import ColumnReorderController from "../../controllers/issues/controller.reorder_columns";
import BoardIssuesSearchController from "../../controllers/issues/controller.search_board_issues";
import IssueSearchController from "../../controllers/issues/controller.search_issues";
import IssueUnassignController from "../../controllers/issues/controller.unassign_issue";
import ColumnUpdateController from "../../controllers/issues/controller.update_column";
import IssueUpdateController from "../../controllers/issues/controller.update_issue";
import { require_auth } from "../../middlewares/middleware.auth";

const issues_router: Router = Router();

issues_router.post("/create", require_auth, IssueCreateController.process);
issues_router.get("/board/:project_id/columns", require_auth, BoardColumnsGetController.process);
issues_router.get("/board/:project_id/search", require_auth, BoardIssuesSearchController.process);
issues_router.get("/board/:project_id/my", require_auth, MyIssuesListController.process);
issues_router.get("/board/:project_id", require_auth, IssueGetController.process);
issues_router.get("/search/:project_id", require_auth, IssueSearchController.process);

issues_router.post("/columns", require_auth, ColumnCreateController.process);
issues_router.patch("/columns/reorder", require_auth, ColumnReorderController.process);
issues_router.patch("/columns/:id", require_auth, ColumnUpdateController.process);
issues_router.delete("/columns/:id", require_auth, ColumnDeleteController.process);

issues_router.patch("/bulk", require_auth, IssueBulkUpdateController.process);
issues_router.post("/bulk/delete", require_auth, IssueBulkDeleteController.process);

issues_router.get("/:id", require_auth, IssueGetByIdController.process);

issues_router.patch("/:id", require_auth, IssueUpdateController.process);
issues_router.delete("/:id", require_auth, IssueDeleteController.process);

issues_router.get("/:id/references", require_auth, IssueReferencesGetController.process);
issues_router.get("/:id/activity", require_auth, IssueActivityListController.process);

issues_router.post("/:id/assignees", require_auth, IssueAssignController.process);
issues_router.delete("/:id/assignees/:user_id", require_auth, IssueUnassignController.process);

export default issues_router;
