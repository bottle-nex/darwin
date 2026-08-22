import { Request, Response } from "express";
import { z } from "zod";
import { Action, Permissions } from "@trymatcha/access-control";
import { prisma } from "@trymatcha/database";
import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";
import GithubAppService from "../../services/service.github_app";
import GithubUserService from "../../services/service.github_user";

const body_schema = z.object({
    orgId: z.string().min(1),
});

/**
 * `POST /github/connect/start` — begin connecting a GitHub org.
 *
 * Verifies the caller may manage connectors on the org, refuses if one is
 * already connected (1:1), stashes a single-use `state` in Redis, and returns
 * the GitHub App install URL for the browser to navigate to.
 */
export default class ConnectStartController {
    static async process(req: Request, res: Response) {
        const parsed = body_schema.safeParse(req.body);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "orgId is required");
        }

        try {
            const { orgId } = parsed.data;
            const userId = req.user.id;

            const role = await Access.org(userId, orgId);
            if (!role || !Permissions.org(role, Action.org.manage_connectors)) {
                return ResponseWriter.not_authorized(
                    res,
                    "You don't have permission to connect GitHub for this org",
                );
            }

            const existing = await prisma.githubInstallation.findUnique({
                where: { orgId },
                select: { id: true },
            });
            if (existing) {
                return ResponseWriter.custom(
                    res,
                    false,
                    "GITHUB_ALREADY_CONNECTED",
                    "This organization is already connected to GitHub.",
                    409,
                );
            }

            const state = await GithubUserService.create_state({ orgId, userId });
            return ResponseWriter.redirect(
                res,
                GithubAppService.buildInstallUrl(state),
                "Redirect to GitHub to install the app",
            );
        } catch (error) {
            console.error("error in connect_start controller", error);
            return ResponseWriter.system_error(res);
        }
    }
}
