import { Router } from "express";

import QuestionsController from "../../controllers/questions/controller.questions";
import { require_auth } from "../../middlewares/middleware.auth";

const questions_router: Router = Router();

questions_router.get("/issue/:issueId", require_auth, QuestionsController.for_issue);
questions_router.get("/:id", require_auth, QuestionsController.get);
questions_router.post("/:id/answer", require_auth, QuestionsController.answer);
questions_router.post("/:id/secret", require_auth, QuestionsController.answer_secret);

export default questions_router;
