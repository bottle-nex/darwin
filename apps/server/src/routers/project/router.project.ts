import { Router } from "express";
import { require_auth } from "../../middlewares/middleware.auth";
import create_project_controller from "../../controllers/project/controller.create_project";
import get_project_controller from "../../controllers/project/controller.get_project";

const project_router: Router = Router();

project_router.post("/create", require_auth, create_project_controller);
project_router.get("/:project_id", require_auth, get_project_controller);

export default project_router;