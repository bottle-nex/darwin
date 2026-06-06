import { Router } from "express";
import { require_auth } from "../../middlewares/middleware.auth";
import InviteMembersController from "../../controllers/invitations/controller.invite_member";
import AcceptInviteController from "../../controllers/invitations/controller.accept_invite";
import RejectInviteController from "../../controllers/invitations/controller.reject_invite";
import GetInviteController from "../../controllers/invitations/controller.get_invite";
import ListInvitesController from "../../controllers/invitations/controller.list_invites";

const invitations_router: Router = Router();

invitations_router.post("/invite", require_auth, InviteMembersController.process);
invitations_router.post("/accept", require_auth, AcceptInviteController.process);
invitations_router.post("/reject", require_auth, RejectInviteController.process);

invitations_router.get('/:token', requireAuth, GetInviteController.process);
invitations_router.get('/', requireAuth, ListInvitesController.process);

export default invitations_router;
