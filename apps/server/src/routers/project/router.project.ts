import { Router } from "express";
import { require_auth } from "../../middlewares/middleware.auth";
import create_project_controller from "../../controllers/project/controller.create_project";
import list_projects_controller from "../../controllers/project/controller.list_projects";

const project_router: Router = Router();

project_router.post("/create", require_auth, create_project_controller);
project_router.get("/get", require_auth, list_projects_controller);

export default project_router;
