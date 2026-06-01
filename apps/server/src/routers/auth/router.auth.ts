import { Router } from "express";
import GenerateOtpController from "../../controllers/auth/controller.generate-otp";
import OtpVerifyController from "../../controllers/auth/controller.verify-otp";

const auth_router: Router = Router();

auth_router.post("/otp/request", GenerateOtpController.generate);
auth_router.post("/otp/verify", OtpVerifyController.verify);

export default auth_router;
