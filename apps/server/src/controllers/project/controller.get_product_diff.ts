import { Action, Permissions } from "@trymatcha/access-control";
import { prisma } from "@trymatcha/database";
import { type CapsuleManifest, is_capsule_manifest } from "@trymatcha/types";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import GithubPullsService from "../../services/service.github_pulls";
import ProductDiffService from "../../services/service.product_diff";
import ResponseWriter from "../../services/service.response";

const params_schema = z.object({
    project_id: z.string(),
    product_diff_id: z.string(),
});

export default async function get_product_diff_controller(req: Request, res: Response) {
    try {
        const parsed = params_schema.safeParse(req.params);
        if (!parsed.success) {
            ResponseWriter.invalid_data(res, "Invalid Product Diff");
            return;
        }

        const { project_id, product_diff_id } = parsed.data;
        const project_role = await Access.project(req.user.id, project_id);
        if (!project_role || !Permissions.project(project_role, Action.project.read)) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const product_diff = await prisma.productDiff.findFirst({
            where: { id: product_diff_id, issue: { projectId: project_id } },
            include: {
                issue: {
                    include: {
                        project: { include: { githubInstallation: true } },
                    },
                },
            },
        });
        if (!product_diff) {
            ResponseWriter.not_found(res, "Product Diff not found");
            return;
        }

        let status = product_diff.status;
        const project = product_diff.issue.project;
        if (status === "Ready" && project.githubRepoFullName && project.githubInstallation) {
            const [owner, repo] = project.githubRepoFullName.split("/");
            if (owner && repo) {
                const pull = await GithubPullsService.getPullRequest(
                    Number(project.githubInstallation.installationId),
                    owner,
                    repo,
                    product_diff.pullNumber,
                );
                if (
                    pull.state !== "open" ||
                    pull.baseSha !== product_diff.baseSha ||
                    pull.headSha !== product_diff.headSha
                ) {
                    await prisma.productDiff.updateMany({
                        where: { id: product_diff.id, status: "Ready" },
                        data: { status: "Stale" },
                    });
                    status = "Stale";
                }
            }
        }

        const manifest = is_capsule_manifest(product_diff.manifest)
            ? (product_diff.manifest as CapsuleManifest)
            : null;

        ResponseWriter.success(res, {
            ...ProductDiffService.to_summary({ ...product_diff, status }),
            manifest,
        });
    } catch (error) {
        console.error("error in get_product_diff_controller:", error);
        ResponseWriter.system_error(res);
    }
}
