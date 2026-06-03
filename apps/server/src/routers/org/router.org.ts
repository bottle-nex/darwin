import { Router } from "express";
import { requireAuth } from "../../middlewares/middleware.auth";
import CreateOrgController from "../../controllers/org/controller.create-org";

const org_router: Router = Router();

org_router.post("/create", requireAuth, CreateOrgController.process);

export default org_router;
