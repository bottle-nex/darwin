import { Router } from "express";

import ChangeMemberAuthority from "../../controllers/teams/controller.change_member_authority";
import CreateTeamController from "../../controllers/teams/controller.create_team";
import DeleteTeamController from "../../controllers/teams/controller.delete_team";
import GetTeamMembersController from "../../controllers/teams/controller.get_team_members";
import RemoveMembersController from "../../controllers/teams/controller.remove_members";
import UpdateTeamController from "../../controllers/teams/controller.update_team";
import { require_auth } from "../../middlewares/middleware.auth";

const teams_router: Router = Router();

teams_router.post("/create", require_auth, CreateTeamController.process);
teams_router.post("/update", require_auth, UpdateTeamController.process);
teams_router.post("/remove-members", require_auth, RemoveMembersController.process);
teams_router.post("/change-authority", require_auth, ChangeMemberAuthority.process);
teams_router.get("/:teamId/members", require_auth, GetTeamMembersController.process);
teams_router.delete("/:teamId", require_auth, DeleteTeamController.process);

export default teams_router;
