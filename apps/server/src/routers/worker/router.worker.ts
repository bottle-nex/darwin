import { Router } from "express";

import AskWorkerQuestionController from "../../controllers/worker/controller.ask_worker_question";
import ReportRunCompletedController from "../../controllers/worker/controller.report_run_completed";
import ReportRunFailedController from "../../controllers/worker/controller.report_run_failed";
import ReportRunStartedController from "../../controllers/worker/controller.report_run_started";
import ReportWorkerStatusController from "../../controllers/worker/controller.report_status";
import { require_worker_auth } from "../../middlewares/middleware.worker_auth";

const worker_router: Router = Router();

worker_router.post("/status", require_worker_auth, ReportWorkerStatusController.process);
worker_router.post("/run-started", require_worker_auth, ReportRunStartedController.process);
worker_router.post("/run-completed", require_worker_auth, ReportRunCompletedController.process);
worker_router.post("/run-failed", require_worker_auth, ReportRunFailedController.process);
worker_router.post("/ask", require_worker_auth, AskWorkerQuestionController.ask);
worker_router.get("/answer", require_worker_auth, AskWorkerQuestionController.answer);

export default worker_router;
