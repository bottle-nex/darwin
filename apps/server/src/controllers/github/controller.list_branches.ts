import { Request, Response } from "express";
import { z } from "zod";
import { Action, Permissions } from "@trymatcha/access-control";
import { prisma } from "@trymatcha/database";
import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";
import GithubAppService from "../../services/service.github_app";

const params_schema = z.object({
    orgId: z.string().min(1),
    owner: z.string().min(1),
    repo: z.string().min(1),
});

export default class ListBranchesController {
    static async process(req: Request, res: Response) {
        const parsed = params_schema.safeParse(req.params);
        if (!parsed.success) {
            return ResponseWriter.invalid_data(res, "orgId, owner and repo are required");
        }

        try {
            const { orgId, owner, repo } = parsed.data;
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

            const branches = await GithubAppService.listRepoBranches(
                Number(installation.installationId),
                owner,
                repo,
            );
            return ResponseWriter.success(res, branches, "Branches fetched");
        } catch (error) {
            console.error("error in list_branches controller", error);
            return ResponseWriter.system_error(res);
        }
    }
}
