import { Router } from "express";

import AcceptInviteController from "../../controllers/invitations/controller.accept_invite";
import GetInviteController from "../../controllers/invitations/controller.get_invite";
import InviteMembersController from "../../controllers/invitations/controller.invite_member";
import ListInvitesController from "../../controllers/invitations/controller.list_invites";
import RejectInviteController from "../../controllers/invitations/controller.reject_invite";
import RevokeInviteController from "../../controllers/invitations/controller.revoke_invite";
import { require_auth } from "../../middlewares/middleware.auth";

const invitations_router: Router = Router();

invitations_router.post("/invite", require_auth, InviteMembersController.process);
invitations_router.post("/accept", require_auth, AcceptInviteController.process);
invitations_router.post("/reject", require_auth, RejectInviteController.process);
invitations_router.post("/revoke", require_auth, RevokeInviteController.process);

invitations_router.get("/:token", require_auth, GetInviteController.process);
invitations_router.get("/", require_auth, ListInvitesController.process);

export default invitations_router;
