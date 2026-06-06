import { Router } from "express";
import { require_auth } from "../../middlewares/middleware.auth";
import CreateOrgController from "../../controllers/org/controller.create_org";
import ListOrgsController from "../../controllers/org/controller.list_orgs";
import UpdateOrgController from "../../controllers/org/controller.update_org";
import DeleteOrgController from "../../controllers/org/controller.delete_org";

const org_router: Router = Router();

org_router.get("/", require_auth, ListOrgsController.process);
org_router.post("/create", require_auth, CreateOrgController.process);
org_router.post("/update", require_auth, UpdateOrgController.process);
org_router.delete("/delete", require_auth, DeleteOrgController.process);

export default org_router;
