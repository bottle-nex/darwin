import { Router } from "express";
import IssueCreateController from "../../controllers/issues/controller.create_issues";
import { require_auth } from "../../middlewares/middleware.auth";

const issues_router: Router = Router();

issues_router.post("/create", require_auth, IssueCreateController.process);

export default issues_router;
