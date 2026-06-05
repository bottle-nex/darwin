import { Router } from "express";
import { requireAuth } from "../../middlewares/middleware.auth";
import create_project_controller from "../../controllers/project/controller.create_project";

const project_router: Router = Router();

project_router.post("/create", requireAuth, create_project_controller);

export default project_router;
