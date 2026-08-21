import { Action, Permissions } from "@trymatcha/access-control";
import { prisma } from "@trymatcha/database";
import { is_product_diff_manifest_v2, type ProductDiffManifest } from "@trymatcha/types";
import { Request, Response } from "express";
import z from "zod";
import Access from "../../access-control/access";
import GithubService from "../../services/service.github";
import ProductDiffService from "../../services/service.product_diff";
import ResponseWriter from "../../services/service.response";
import StorageService from "../../services/service.storage";

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
                const pull = await GithubService.getPullRequest(
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

        const manifest = product_diff.manifest as ProductDiffManifest | null;
        const serves_html =
            status === "Ready" &&
            Boolean(product_diff.artifactPrefix) &&
            !is_product_diff_manifest_v2(manifest);

        const urls = serves_html
            ? await Promise.all([
                  StorageService.signed_product_diff_url(
                      `${product_diff.artifactPrefix}/base.html`,
                  ),
                  StorageService.signed_product_diff_url(
                      `${product_diff.artifactPrefix}/head.html`,
                  ),
              ])
            : [null, null];

        ResponseWriter.success(res, {
            ...ProductDiffService.to_summary({ ...product_diff, status }),
            manifest,
            baseUrl: urls[0],
            headUrl: urls[1],
        });
    } catch (error) {
        console.error("error in get_product_diff_controller:", error);
        ResponseWriter.system_error(res);
    }
}
