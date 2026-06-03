import { Router } from "express";
import { requireAuth } from "../../middlewares/middleware.auth";
import CreateOrgController from "../../controllers/org/controller.create_org";
import ListOrgsController from "../../controllers/org/controller.list_orgs";
import UpdateOrgController from "../../controllers/org/controller.update_org";
import DeleteOrgController from "../../controllers/org/controller.delete_org";

const org_router: Router = Router();

org_router.get("/", requireAuth, ListOrgsController.process);
org_router.post("/create", requireAuth, CreateOrgController.process);
org_router.post("/update", requireAuth, UpdateOrgController.process);
org_router.delete("/delete", requireAuth, DeleteOrgController.process);

export default org_router;
