import { Router } from "express";
import { requireAuth } from "../../middlewares/middleware.auth";
import CreateOrgController from "../../controllers/org/controller.create-org";
import ListOrgsController from "../../controllers/org/controller.list-orgs";

const org_router: Router = Router();

org_router.get("/", requireAuth, ListOrgsController.process);
org_router.post("/create", requireAuth, CreateOrgController.process);

export default org_router;
