import { Router } from "express";

import GlobalSearchController from "../../controllers/search/controller.global_search";
import { require_auth } from "../../middlewares/middleware.auth";

const search_router: Router = Router();

search_router.get("/:project_id", require_auth, GlobalSearchController.process);

export default search_router;
