import { Router } from "express";
import { requireAuth } from "../../middlewares/middleware.auth";
import InviteMembersController from "../../controllers/invitations/controller.invite_member";
import AcceptInviteController from "../../controllers/invitations/controller.accept_invite";
import RejectInviteController from "../../controllers/invitations/controller.reject_invite";

const invitations_router: Router = Router();

invitations_router.post("/invite", requireAuth, InviteMembersController.process);
invitations_router.post("/accept", requireAuth, AcceptInviteController.process);
invitations_router.post("/reject", requireAuth, RejectInviteController.process);

export default invitations_router;
