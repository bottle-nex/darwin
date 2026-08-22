import { Router } from "express";
import { require_auth } from "../../middlewares/middleware.auth";
import GlobalSearchController from "../../controllers/search/controller.global_search";

const search_router: Router = Router();

search_router.get("/:project_id", require_auth, GlobalSearchController.process);

export default search_router;
