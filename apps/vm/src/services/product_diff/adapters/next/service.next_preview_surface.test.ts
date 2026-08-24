import { afterEach, expect, mock, test } from "bun:test";
import type { Sandbox } from "e2b";

import type { ProductDiffWorkspacePlan } from "../../adapter.contract";
import PreviewRunner from "../../../service.preview_runner";
import NextPreviewSurface from "./service.next_preview_surface";

const workspacePlan: ProductDiffWorkspacePlan = {
    repositoryRoot: ".",
    applicationPath: "apps/web",
    workspaceKind: "Standalone",
    installDirectory: ".",
    launchCommand: "bun run dev",
    healthPath: "/",
    router: "AppRouter",
};
const originalCreateNextPreviewSurface = PreviewRunner.create_next_preview_surface;

test("creates a validated job-scoped route for the selected workspace router", async () => {
    const sandbox = {} as Sandbox;
    const create = mock(PreviewRunner.create_next_preview_surface).mockResolvedValue({
        routePath: "/preview-run-a",
        generatedFiles: ["/workspace/apps/web/app/preview-run-a/[targetId]/page.tsx"],
        router: "AppRouter",
    });
    PreviewRunner.create_next_preview_surface = create;

    const surface = await NextPreviewSurface.create(sandbox, "/workspace", workspacePlan, "run-a");

    expect(create).toHaveBeenCalledWith(sandbox, {
        workspaceRoot: "/workspace",
        applicationPath: "apps/web",
        routeSegment: "preview-run-a",
        router: "AppRouter",
    });
    expect(surface.generatedFiles).toHaveLength(1);
});

test("rejects a job identifier that cannot form a safe route segment", () => {
    expect(() => NextPreviewSurface.route_segment("Run_A")).toThrow();
});

afterEach(() => {
    PreviewRunner.create_next_preview_surface = originalCreateNextPreviewSurface;
});
