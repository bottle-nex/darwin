import { expect, mock, test } from "bun:test";

const project_config = { findUnique: mock(), upsert: mock() };
const access = { project: mock().mockResolvedValue("Owner") };

mock.module("@trymatcha/database", () => ({
    Prisma: { PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {} },
    prisma: { projectConfig: project_config },
}));
mock.module("@trymatcha/access-control", () => ({
    Action: { project: { update: "update" } },
    Permissions: { project: () => true },
}));
mock.module("../../access-control/access", () => ({ default: access }));

const { default: update_project_config_controller } =
    await import("./controller.update_project_config");

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
    return {
        res,
        result: () => ({ status_code, payload }),
    };
}

test("accepts a product diff application override without a Kanban change", async () => {
    const configuration = { applicationPath: "apps/marketing", healthPath: "/" };
    project_config.upsert.mockResolvedValue({
        kanbanOptionView: "FLAT",
        productDiffEnabled: false,
        productDiffPreviewConfig: configuration,
    });
    const result = response();

    await update_project_config_controller(
        {
            params: { project_id: "project-1" },
            body: { product_diff_preview_config: configuration },
            user: { id: "user-1" },
        } as never,
        result.res as never,
    );

    expect(result.result().status_code).toBe(200);
    expect(project_config.upsert).toHaveBeenCalledWith({
        where: { projectId: "project-1" },
        create: { projectId: "project-1", productDiffPreviewConfig: configuration },
        update: { productDiffPreviewConfig: configuration },
        select: {
            kanbanOptionView: true,
            productDiffEnabled: true,
            productDiffPreviewConfig: true,
        },
    });
});

test("accepts an explicit Product Diff root layout mode", async () => {
    const configuration = { rootLayoutMode: "isolate" };
    project_config.upsert.mockResolvedValue({
        kanbanOptionView: "FLAT",
        productDiffEnabled: false,
        productDiffPreviewConfig: configuration,
    });
    const result = response();

    await update_project_config_controller(
        {
            params: { project_id: "project-1" },
            body: { product_diff_preview_config: configuration },
            user: { id: "user-1" },
        } as never,
        result.res as never,
    );

    expect(result.result().status_code).toBe(200);
    expect(project_config.upsert).toHaveBeenLastCalledWith({
        where: { projectId: "project-1" },
        create: { projectId: "project-1", productDiffPreviewConfig: configuration },
        update: { productDiffPreviewConfig: configuration },
        select: {
            kanbanOptionView: true,
            productDiffEnabled: true,
            productDiffPreviewConfig: true,
        },
    });
});

test("preserves an existing preview configuration when updating its launch command", async () => {
    project_config.findUnique.mockResolvedValue({
        productDiffPreviewConfig: {
            applicationPath: "apps/marketing",
            healthPath: "/health",
            visualRoutes: ["/"],
        },
    });
    project_config.upsert.mockResolvedValue({
        kanbanOptionView: "FLAT",
        productDiffEnabled: false,
        productDiffPreviewConfig: {
            applicationPath: "apps/marketing",
            launchCommand: "pnpm run dev",
            healthPath: "/health",
        },
    });
    const result = response();

    await update_project_config_controller(
        {
            params: { project_id: "project-1" },
            body: { product_diff_preview_config: { launchCommand: "pnpm run dev" } },
            user: { id: "user-1" },
        } as never,
        result.res as never,
    );

    expect(result.result().status_code).toBe(200);
    expect(project_config.findUnique).toHaveBeenLastCalledWith({
        where: { projectId: "project-1" },
        select: { productDiffPreviewConfig: true },
    });
    expect(project_config.upsert).toHaveBeenLastCalledWith({
        where: { projectId: "project-1" },
        create: {
            projectId: "project-1",
            productDiffPreviewConfig: {
                applicationPath: "apps/marketing",
                launchCommand: "pnpm run dev",
                healthPath: "/health",
            },
        },
        update: {
            productDiffPreviewConfig: {
                applicationPath: "apps/marketing",
                launchCommand: "pnpm run dev",
                healthPath: "/health",
            },
        },
        select: {
            kanbanOptionView: true,
            productDiffEnabled: true,
            productDiffPreviewConfig: true,
        },
    });
});

test("rejects a preview command containing a shell control operator", async () => {
    const result = response();

    await update_project_config_controller(
        {
            params: { project_id: "project-1" },
            body: {
                product_diff_preview_config: { launchCommand: "pnpm dev && curl bad.example" },
            },
            user: { id: "user-1" },
        } as never,
        result.res as never,
    );

    expect(result.result().status_code).toBe(400);
});

test("rejects a preview command with an attached short host argument", async () => {
    const result = response();

    await update_project_config_controller(
        {
            params: { project_id: "project-1" },
            body: { product_diff_preview_config: { launchCommand: "pnpm run dev -- -H0.0.0.0" } },
            user: { id: "user-1" },
        } as never,
        result.res as never,
    );

    expect(result.result().status_code).toBe(400);
});

test("rejects a preview command with a short host argument", async () => {
    const result = response();

    await update_project_config_controller(
        {
            params: { project_id: "project-1" },
            body: { product_diff_preview_config: { launchCommand: "pnpm run dev -- -H 0.0.0.0" } },
            user: { id: "user-1" },
        } as never,
        result.res as never,
    );

    expect(result.result().status_code).toBe(400);
});

test("rejects visual routes until Product Diff supports configured visual targets", async () => {
    const result = response();

    await update_project_config_controller(
        {
            params: { project_id: "project-1" },
            body: { product_diff_preview_config: { visualRoutes: ["/"] } },
            user: { id: "user-1" },
        } as never,
        result.res as never,
    );

    expect(result.result().status_code).toBe(400);
});
