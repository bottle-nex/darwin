import { Router } from "express";

import AdminOtpRequestController from "../../controllers/admin/controller.admin-otp-request";
import AdminOtpVerifyController from "../../controllers/admin/controller.admin-otp-verify";
import CreatePostController from "../../controllers/admin/controller.create-post";
import DeletePostController from "../../controllers/admin/controller.delete-post";
import GetPostController from "../../controllers/admin/controller.get-post";
import ListPostsController from "../../controllers/admin/controller.list-posts";
import SignedUploadController from "../../controllers/admin/controller.signed-upload";
import UpdatePostController from "../../controllers/admin/controller.update-post";
import { require_admin } from "../../middlewares/middleware.admin_auth";

const admin_router: Router = Router();

admin_router.post("/auth/otp/request", AdminOtpRequestController.process);
admin_router.post("/auth/otp/verify", AdminOtpVerifyController.process);

admin_router.use(require_admin);

admin_router.get("/posts", ListPostsController.process);
admin_router.post("/posts", CreatePostController.process);
admin_router.get("/posts/:id", GetPostController.process);
admin_router.patch("/posts/:id", UpdatePostController.process);
admin_router.delete("/posts/:id", DeletePostController.process);
admin_router.post("/uploads/signed-url", SignedUploadController.process);

export default admin_router;
