import { Router } from "express";

import IssueAssignController from "../../controllers/issues/controller.assign_issue";
import IssueBulkDeleteController from "../../controllers/issues/controller.bulk_delete_issues";
import IssueBulkUpdateController from "../../controllers/issues/controller.bulk_update_issues";
import ColumnCreateController from "../../controllers/issues/controller.create_column";
import IssueCreateController from "../../controllers/issues/controller.create_issues";
import SpaceCreateController from "../../controllers/issues/controller.create_space";
import ColumnDeleteController from "../../controllers/issues/controller.delete_column";
import IssueDeleteController from "../../controllers/issues/controller.delete_issue";
import SpaceDeleteController from "../../controllers/issues/controller.delete_space";
import RunLogsDownloadController from "../../controllers/issues/controller.download_run_logs";
import BoardColumnsGetController from "../../controllers/issues/controller.get_board_columns";
import IssueGetByIdController from "../../controllers/issues/controller.get_issue";
import IssueGetConfigController from "../../controllers/issues/controller.get_issue_config";
import IssueReferencesGetController from "../../controllers/issues/controller.get_issue_references";
import IssueGetController from "../../controllers/issues/controller.get_issues";
import RunLogsGetController from "../../controllers/issues/controller.get_run_logs";
import ViewPreferencesGetController from "../../controllers/issues/controller.get_view_preferences";
import IssueActivityListController from "../../controllers/issues/controller.list_activity";
import IssueAttemptListController from "../../controllers/issues/controller.list_issue_attempts";
import MyIssuesListController from "../../controllers/issues/controller.list_my_issues";
import IssueReopenController from "../../controllers/issues/controller.reopen_issue";
import ColumnReorderController from "../../controllers/issues/controller.reorder_columns";
import BoardIssuesSearchController from "../../controllers/issues/controller.search_board_issues";
import IssueSearchController from "../../controllers/issues/controller.search_issues";
import IssueSetConfigController from "../../controllers/issues/controller.set_issue_config";
import ViewPreferenceSetController from "../../controllers/issues/controller.set_view_preference";
import IssueUnassignController from "../../controllers/issues/controller.unassign_issue";
import ColumnUpdateController from "../../controllers/issues/controller.update_column";
import IssueUpdateController from "../../controllers/issues/controller.update_issue";
import SpaceUpdateController from "../../controllers/issues/controller.update_space";
import { require_auth } from "../../middlewares/middleware.auth";

const issues_router: Router = Router();

issues_router.post("/create", require_auth, IssueCreateController.process);
issues_router.get("/board/:project_id/columns", require_auth, BoardColumnsGetController.process);
issues_router.get("/board/:project_id/search", require_auth, BoardIssuesSearchController.process);
issues_router.get("/board/:project_id/my", require_auth, MyIssuesListController.process);
issues_router.get("/board/:project_id", require_auth, IssueGetController.process);
issues_router.get("/search/:project_id", require_auth, IssueSearchController.process);

issues_router.get("/views/:project_id", require_auth, ViewPreferencesGetController.process);
issues_router.patch("/views/:project_id", require_auth, ViewPreferenceSetController.process);

issues_router.post("/spaces", require_auth, SpaceCreateController.process);
issues_router.patch("/spaces/:id", require_auth, SpaceUpdateController.process);
issues_router.delete("/spaces/:id", require_auth, SpaceDeleteController.process);

issues_router.post("/columns", require_auth, ColumnCreateController.process);
issues_router.patch("/columns/reorder", require_auth, ColumnReorderController.process);
issues_router.patch("/columns/:id", require_auth, ColumnUpdateController.process);
issues_router.delete("/columns/:id", require_auth, ColumnDeleteController.process);

issues_router.get("/runs/:run_id/logs", require_auth, RunLogsGetController.process);
issues_router.get("/runs/:run_id/logs/download", require_auth, RunLogsDownloadController.process);

issues_router.patch("/bulk", require_auth, IssueBulkUpdateController.process);
issues_router.post("/bulk/delete", require_auth, IssueBulkDeleteController.process);

issues_router.get("/:id", require_auth, IssueGetByIdController.process);

issues_router.patch("/:id", require_auth, IssueUpdateController.process);
issues_router.delete("/:id", require_auth, IssueDeleteController.process);

issues_router.get("/:id/config", require_auth, IssueGetConfigController.process);
issues_router.put("/:id/config", require_auth, IssueSetConfigController.process);

issues_router.get("/:id/references", require_auth, IssueReferencesGetController.process);
issues_router.get("/:id/activity", require_auth, IssueActivityListController.process);
issues_router.get("/:id/attempts", require_auth, IssueAttemptListController.process);

issues_router.post("/:id/reopen", require_auth, IssueReopenController.process);
issues_router.post("/:id/assignees", require_auth, IssueAssignController.process);
issues_router.delete("/:id/assignees/:user_id", require_auth, IssueUnassignController.process);

export default issues_router;
