import { Router } from "express";
import { require_worker_auth } from "../../middlewares/middleware.worker_auth";
import ReportWorkerStatusController from "../../controllers/worker/controller.report_status";
import ReportPrOpenedController from "../../controllers/worker/controller.report_pr_opened";

const worker_router: Router = Router();

worker_router.post("/status", require_worker_auth, ReportWorkerStatusController.process);
worker_router.post("/pr-opened", require_worker_auth, ReportPrOpenedController.process);

export default worker_router;
