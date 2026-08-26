import { Action, Permissions } from "@trymatcha/access-control";
import { prisma } from "@trymatcha/database";
import { capsule_artifact_keys, type CapsuleManifest, is_capsule_manifest } from "@trymatcha/types";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";
import StorageService from "../../services/service.storage";

const params_schema = z.object({
    project_id: z.string(),
    product_diff_id: z.string(),
});

const body_schema = z.object({
    keys: z.array(z.string().min(1).max(300)).min(1).max(64),
});

export default async function product_diff_artifact_urls_controller(req: Request, res: Response) {
    try {
        const parsed_params = params_schema.safeParse(req.params);
        const parsed_body = body_schema.safeParse(req.body);
        if (!parsed_params.success || !parsed_body.success) {
            ResponseWriter.invalid_data(res, "Invalid Product Diff artifact request");
            return;
        }

        const { project_id, product_diff_id } = parsed_params.data;
        const project_role = await Access.project(req.user.id, project_id);
        if (!project_role || !Permissions.project(project_role, Action.project.read)) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const product_diff = await prisma.productDiff.findFirst({
            where: { id: product_diff_id, issue: { projectId: project_id } },
            select: { status: true, manifest: true, artifactPrefix: true },
        });
        if (!product_diff) {
            ResponseWriter.not_found(res, "Product Diff not found");
            return;
        }
        if (product_diff.status !== "Ready" || !product_diff.artifactPrefix) {
            ResponseWriter.custom(
                res,
                false,
                "PRODUCT_DIFF_NOT_READY",
                "This Product Diff has no capsules to show",
                409,
            );
            return;
        }

        const allowed = capsule_artifact_keys(
            is_capsule_manifest(product_diff.manifest)
                ? (product_diff.manifest as CapsuleManifest)
                : null,
        );
        const requested = parsed_body.data.keys.filter((key) => allowed.has(key));
        if (requested.length !== parsed_body.data.keys.length) {
            ResponseWriter.invalid_data(
                res,
                "Requested a capsule page this Product Diff does not have",
            );
            return;
        }

        const urls = await StorageService.signed_product_diff_urls(
            requested.map((key) => `${product_diff.artifactPrefix}/${key}`),
        );
        const byManifestKey = Object.fromEntries(
            requested.map((key) => [key, urls[`${product_diff.artifactPrefix}/${key}`]!]),
        );

        ResponseWriter.success(res, { urls: byManifestKey });
    } catch (error) {
        console.error("error in product_diff_artifact_urls_controller:", error);
        ResponseWriter.system_error(res);
    }
}
