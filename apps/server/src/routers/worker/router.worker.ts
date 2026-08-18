import { Router } from "express";
import { require_worker_auth } from "../../middlewares/middleware.worker_auth";
import ReportWorkerStatusController from "../../controllers/worker/controller.report_status";
import ReportPrOpenedController from "../../controllers/worker/controller.report_pr_opened";
import ReportRunStartedController from "../../controllers/worker/controller.report_run_started";
import ReportRunCompletedController from "../../controllers/worker/controller.report_run_completed";
import ReportRunFailedController from "../../controllers/worker/controller.report_run_failed";

const worker_router: Router = Router();

worker_router.post("/status", require_worker_auth, ReportWorkerStatusController.process);
worker_router.post("/pr-opened", require_worker_auth, ReportPrOpenedController.process);
worker_router.post("/run-started", require_worker_auth, ReportRunStartedController.process);
worker_router.post("/run-completed", require_worker_auth, ReportRunCompletedController.process);
worker_router.post("/run-failed", require_worker_auth, ReportRunFailedController.process);

export default worker_router;
