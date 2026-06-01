import { Router } from "express";
import auth_router from "../auth/router.auth";

const v1_router: Router = Router();

v1_router.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

v1_router.use("/auth", auth_router);

export default v1_router;
