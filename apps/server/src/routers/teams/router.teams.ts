import { Router } from "express";
import { requireAuth } from "../../middlewares/middleware.auth";
import CreateTeamController from "../../controllers/teams/controller.create_team";
import UpdateTeamController from "../../controllers/teams/controller.update_team";
import RemoveMembersController from "../../controllers/teams/controller.remove_members";

const teams_router: Router = Router();

teams_router.post("/create", requireAuth, CreateTeamController.process);
teams_router.post("/update", requireAuth, UpdateTeamController.process);
teams_router.post("/remove-members", requireAuth, RemoveMembersController.process);

export default teams_router;
