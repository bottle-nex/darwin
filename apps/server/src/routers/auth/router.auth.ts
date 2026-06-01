import { Router } from "express";
import GenerateOtpController from "../../controllers/auth/controller.generate-otp";
import OtpVerifyController from "../../controllers/auth/controller.verify-otp";
import SignInController from "../../controllers/auth/controller.sign-in";

const auth_router: Router = Router();

auth_router.post("/sign-in", SignInController.process);
auth_router.post("/otp/request", GenerateOtpController.process);
auth_router.post("/otp/verify", OtpVerifyController.process);

export default auth_router;
