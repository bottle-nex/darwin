import { Request, Response } from "express";
import { z } from "zod";
import { Action, Permissions } from "@trymatcha/access-control";
import { prisma } from "@trymatcha/database";
import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";
import GithubService from "../../services/service.github";

const params_schema = z.object({
    orgId: z.string().min(1),
});

/**
 * `GET /github/installations/:orgId/repos` — list the repos the org's GitHub
 * installation can access, for the project repo picker. Gated on the same
 * permission as creating a project.
 */
export default class ListReposController {
    static async process(req: Request, res: Response) {
        const parsed = params_schema.safeParse(req.params);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "orgId is required");
        }

        try {
            const { orgId } = parsed.data;
            const userId = req.user.id;

            const role = await Access.org(userId, orgId);
            if (!role || !Permissions.org(role, Action.org.create_project)) {
                return ResponseWriter.not_authorized(
                    res,
                    "You don't have permission to view repositories for this org",
                );
            }

            const installation = await prisma.githubInstallation.findUnique({
                where: { orgId },
                select: { installationId: true },
            });
            if (!installation) {
                return ResponseWriter.custom(
                    res,
                    false,
                    "NOT_CONNECTED",
                    "This organization is not connected to GitHub.",
                    404,
                );
            }

            const repos = await GithubService.listInstallationRepos(
                Number(installation.installationId),
            );
            return ResponseWriter.success(res, repos, "Repositories fetched");
        } catch (error) {
            console.error("error in list_repos controller", error);
            return ResponseWriter.system_error(res);
        }
    }
}
