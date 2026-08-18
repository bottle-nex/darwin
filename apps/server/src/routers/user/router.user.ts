import { Router } from "express";
import { require_auth } from "../../middlewares/middleware.auth";
import GetLastVisitedController from "../../controllers/user/controller.get_last_visited";
import SetLastVisitedController from "../../controllers/user/controller.set_last_visited";

const user_router: Router = Router();

user_router.get("/last-visited", require_auth, GetLastVisitedController.process);
user_router.patch("/last-visited", require_auth, SetLastVisitedController.process);

export default user_router;
