import type { ProductDiffRootLayoutMode } from "@trymatcha/types";
import type { Sandbox } from "e2b";

import PreviewRunner, {
    type NextApplicationRouter,
    type PreviewSurface,
} from "../../../service.preview_runner";
import type { ProductDiffWorkspacePlan } from "../../adapter.contract";

const SAFE_ROUTE_SEGMENT = /^[a-z0-9][a-z0-9-]{0,48}$/;

function selected_router(workspacePlan: ProductDiffWorkspacePlan): NextApplicationRouter {
    if (workspacePlan.router === "AppRouter" || workspacePlan.router === "PagesRouter") {
        return workspacePlan.router;
    }
    throw new Error("workspace plan does not select a supported Next router");
}

export default class NextPreviewSurface {
    static route_segment(runId: string): string {
        const routeSegment = `preview-${runId}`;
        if (!SAFE_ROUTE_SEGMENT.test(routeSegment)) {
            throw new Error("preview run identifier cannot form a safe route segment");
        }
        return routeSegment;
    }

    static async create(
        sandbox: Sandbox,
        workspaceRoot: string,
        workspacePlan: ProductDiffWorkspacePlan,
        runId: string,
        rootLayoutMode: ProductDiffRootLayoutMode,
    ): Promise<PreviewSurface> {
        const router = selected_router(workspacePlan);
        return PreviewRunner.create_next_preview_surface(sandbox, {
            workspaceRoot,
            applicationPath: workspacePlan.applicationPath,
            routeSegment: this.route_segment(runId),
            router,
            rootLayoutMode,
        });
    }

    static async remove(sandbox: Sandbox, surface: PreviewSurface | null): Promise<void> {
        if (!surface) return;
        await PreviewRunner.remove_next_preview_surface(sandbox, surface);
    }
}
