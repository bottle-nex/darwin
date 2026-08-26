import { afterAll, beforeEach, expect, mock, test } from "bun:test";
import jwt from "jsonwebtoken";

import { ENV } from "../configs/env";

const product_diff = { findFirst: mock() };
const access = { project: mock() };

mock.module("@trymatcha/database", () => ({ prisma: { productDiff: product_diff } }));
mock.module("@trymatcha/access-control", () => ({
    Action: { project: { read: "read" } },
    Permissions: { project: () => true },
}));
mock.module("../access-control/access", () => ({ default: access }));

const { default: ReplayAccess } = await import("./service.product_diff_replay_access");
const { default: launch_product_diff_replay_controller } =
    await import("../controllers/project/controller.launch_product_diff_replay");

const environment = ENV as unknown as Record<string, unknown>;
const original_enabled = environment.SERVER_PRODUCT_DIFF_REPLAY_ENABLED;
const original_origin = environment.SERVER_PRODUCT_DIFF_REPLAY_ORIGIN;
const artifact_id = "replay/web/billing/default/desktop/head/artifact.json";

function response() {
    let status_code = 200;
    let payload: unknown;
    const res = {
        status(code: number) {
            status_code = code;
            return res;
        },
        json(next: unknown) {
            payload = next;
            return res;
        },
    };
    return { res, result: () => ({ status_code, payload }) };
}

beforeEach(() => {
    environment.SERVER_PRODUCT_DIFF_REPLAY_ENABLED = true;
    environment.SERVER_PRODUCT_DIFF_REPLAY_ORIGIN = "https://replay.trymatcha.test";
    access.project.mockReset();
    product_diff.findFirst.mockReset();
});

afterAll(() => {
    environment.SERVER_PRODUCT_DIFF_REPLAY_ENABLED = original_enabled;
    environment.SERVER_PRODUCT_DIFF_REPLAY_ORIGIN = original_origin;
});

test("issues an artifact-only launch capability to a project member", async () => {
    access.project.mockResolvedValue("Read");
    product_diff.findFirst.mockResolvedValue({
        status: "Ready",
        artifactPrefix: "product-diffs/project-1/product-diff-1",
        manifest: {
            version: 4,
            framework: "NextAppRouter",
            applications: [{ id: "web", applicationPath: "apps/web", adapterId: "next" }],
            surfaces: [
                {
                    id: "billing",
                    applicationId: "web",
                    label: "Billing",
                    states: [
                        {
                            id: "default",
                            label: "Default",
                            viewports: [
                                {
                                    id: "desktop",
                                    label: "Desktop",
                                    width: 1280,
                                    height: 800,
                                    base: {
                                        artifactKey: null,
                                        fidelity: "Unavailable",
                                        diagnostics: [],
                                    },
                                    head: {
                                        artifactKey: artifact_id,
                                        fidelity: "Verified",
                                        diagnostics: [],
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
            warnings: [],
        },
    });
    const result = response();

    await launch_product_diff_replay_controller(
        {
            params: { project_id: "project-1", product_diff_id: "product-diff-1" },
            body: { artifactId: artifact_id },
            user: { id: "member-1" },
        } as never,
        result.res as never,
    );

    expect(result.result().status_code).toBe(200);
    const payload = result.result().payload as { data: { url: string } };
    const launch_url = new URL(payload.data.url);
    expect(launch_url.origin).toBe(
        ReplayAccess.artifact_origin("product-diff-1", artifact_id).origin,
    );
    const content_origin = ReplayAccess.artifact_content_origin("product-diff-1", artifact_id);
    expect(content_origin.hostname).toBe(`content-${launch_url.hostname}`);
    expect(content_origin.origin).not.toBe(launch_url.origin);
    expect(launch_url.origin).not.toBe(
        ReplayAccess.artifact_origin("product-diff-2", artifact_id).origin,
    );
    const token = launch_url.searchParams.get("capability");
    expect(token).not.toBeNull();
    expect(await ReplayAccess.verify(token!, artifact_id)).toEqual(
        expect.objectContaining({
            artifactId: artifact_id,
            productDiffId: "product-diff-1",
            projectId: "project-1",
        }),
    );
    expect(Object.keys(jwt.decode(token!) as Record<string, unknown>).sort()).toEqual([
        "artifactId",
        "exp",
        "productDiffId",
        "projectId",
    ]);
});

test("denies a launch capability to a non-member", async () => {
    access.project.mockResolvedValue(null);
    const result = response();

    await launch_product_diff_replay_controller(
        {
            params: { project_id: "project-1", product_diff_id: "product-diff-1" },
            body: { artifactId: artifact_id },
            user: { id: "outsider-1" },
        } as never,
        result.res as never,
    );

    expect(result.result().status_code).toBe(401);
    expect(product_diff.findFirst).not.toHaveBeenCalled();
});

test("rejects an expired replay launch capability", async () => {
    const token = jwt.sign(
        {
            productDiffId: "product-diff-1",
            projectId: "project-1",
            artifactId: artifact_id,
            exp: Math.floor(Date.now() / 1000) - 1,
        },
        ENV.SERVER_JWT_SECRET,
        { algorithm: "HS256", noTimestamp: true },
    );

    await expect(ReplayAccess.verify(token, artifact_id)).rejects.toThrow("expired");
});

test("rejects a replay capability for a different artifact", async () => {
    const token = ReplayAccess.issue({
        productDiffId: "product-diff-1",
        projectId: "project-1",
        artifactId: artifact_id,
    });

    await expect(
        ReplayAccess.verify(token, "replay/web/billing/default/desktop/base/artifact.json"),
    ).rejects.toThrow("artifact");
});
