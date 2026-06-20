import { Router } from "express";
import { require_auth } from "../../middlewares/middleware.auth";
import IssueCreateController from "../../controllers/issues/controller.create_issues";

const issues_router: Router = Router();

issues_router.post("/create", require_auth, IssueCreateController.process);

export default issues_router;
