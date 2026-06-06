import { Router } from "express";
import { require_auth } from "../../middlewares/middleware.auth";
import CreateTeamController from "../../controllers/teams/controller.create_team";
import UpdateTeamController from "../../controllers/teams/controller.update_team";
import RemoveMembersController from "../../controllers/teams/controller.remove_members";

const teams_router: Router = Router();

teams_router.post("/create", require_auth, CreateTeamController.process);
teams_router.post("/update", require_auth, UpdateTeamController.process);
teams_router.post("/remove-members", require_auth, RemoveMembersController.process);

export default teams_router;
