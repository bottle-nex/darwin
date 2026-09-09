import { Router } from "express";

import SignedUploadController from "../../controllers/uploads/controller.signed_upload";
import { require_auth } from "../../middlewares/middleware.auth";

const uploads_router: Router = Router();

uploads_router.post("/signed-url", require_auth, SignedUploadController.process);

export default uploads_router;
