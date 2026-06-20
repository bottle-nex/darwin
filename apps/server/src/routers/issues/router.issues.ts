import { Router } from "express";
import { require_auth } from "../../middlewares/middleware.auth";
import IssueCreateController from "../../controllers/issues/controller.create_issues";
import IssueGetController from "../../controllers/issues/controller.get_issues";
import IssueUpdateController from "../../controllers/issues/controller.update_issue";
import IssueDeleteController from "../../controllers/issues/controller.delete_issue";
import ColumnCreateController from "../../controllers/issues/controller.create_column";
import ColumnUpdateController from "../../controllers/issues/controller.update_column";
import ColumnDeleteController from "../../controllers/issues/controller.delete_column";

const issues_router: Router = Router();

issues_router.post("/create", require_auth, IssueCreateController.process);
issues_router.get("/board/:project_id", require_auth, IssueGetController.process);

issues_router.post("/columns", require_auth, ColumnCreateController.process);
issues_router.patch("/columns/:id", require_auth, ColumnUpdateController.process);
issues_router.delete("/columns/:id", require_auth, ColumnDeleteController.process);

issues_router.patch("/:id", require_auth, IssueUpdateController.process);
issues_router.delete("/:id", require_auth, IssueDeleteController.process);

export default issues_router;
