import { Action, Permissions } from "@trymatcha/access-control";
import { prisma } from "@trymatcha/database";
import {
    is_replay_product_diff_manifest,
    PRODUCT_DIFF_REPLAY_ARTIFACT_KEY_PATTERN,
    type ProductDiffManifest,
    replayArtifactKeys,
} from "@trymatcha/types";
import type { Request, Response } from "express";
import { z } from "zod";

import Access from "../../access-control/access";
import ReplayAccess from "../../services/service.product_diff_replay_access";
import ResponseWriter from "../../services/service.response";

const params_schema = z.object({
    project_id: z.string().min(1),
    product_diff_id: z.string().min(1),
});

const body_schema = z
    .object({ artifactId: z.string().regex(PRODUCT_DIFF_REPLAY_ARTIFACT_KEY_PATTERN) })
    .strict();

export default async function launch_product_diff_replay_controller(req: Request, res: Response) {
    try {
        const parsed_params = params_schema.safeParse(req.params);
        const parsed_body = body_schema.safeParse(req.body);
        if (!parsed_params.success || !parsed_body.success) {
            ResponseWriter.invalid_data(res, "Invalid Product Diff replay launch request");
            return;
        }
        if (!ReplayAccess.is_configured()) {
            ResponseWriter.custom(
                res,
                false,
                "PRODUCT_DIFF_REPLAY_DISABLED",
                "Product Diff replay is not available",
                503,
            );
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

        const manifest = product_diff.manifest as ProductDiffManifest | null;
        const artifact_id = parsed_body.data.artifactId;
        if (
            product_diff.status !== "Ready" ||
            !product_diff.artifactPrefix ||
            !is_replay_product_diff_manifest(manifest) ||
            !replayArtifactKeys(manifest).has(artifact_id)
        ) {
            ResponseWriter.not_found(res, "Product Diff replay artifact not found");
            return;
        }

        const token = ReplayAccess.issue({
            productDiffId: product_diff_id,
            projectId: project_id,
            artifactId: artifact_id,
        });
        ResponseWriter.success(res, { url: ReplayAccess.launch_url(token, artifact_id) });
    } catch (error) {
        console.error("error in launch_product_diff_replay_controller:", error);
        ResponseWriter.system_error(res);
    }
}
