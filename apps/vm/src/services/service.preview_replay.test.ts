import { expect, test } from "bun:test";
import type { Sandbox } from "e2b";

import PreviewReplay from "./service.preview_replay";

test("captures every surface independently with adapter-bound browser asset paths", async () => {
    const requests: unknown[] = [];
    const sandbox = {
        files: {
            write: async (_path: string, contents: string) => {
                requests.push(JSON.parse(contents));
            },
            read: async () =>
                JSON.stringify({
                    artifactKey: "artifact.json",
                    fidelity: "Verified",
                    diagnostics: [],
                    resourceCount: 12,
                    packageBytes: 8192,
                    captureDurationMs: 1400,
                    validationOutcome: "Verified",
                    evidence: {
                        scenarios: [
                            {
                                id: "open",
                                label: "Open",
                                outcome: "Succeeded",
                                actions: [{ index: 0, kind: "click", outcome: "Succeeded" }],
                            },
                        ],
                        dom: {
                            elementCount: 12,
                            interactiveElementCount: 1,
                            visibleTextLength: 40,
                        },
                        accessibility: {
                            landmarkCount: 1,
                            headingCount: 1,
                            labeledControlCount: 1,
                            unlabeledControlCount: 0,
                        },
                        consoleDiagnostics: [],
                        failedRequestDiagnostics: [],
                    },
                }),
        },
        commands: {
            run: async () => ({ exitCode: 0, stdout: "", stderr: "" }),
        },
    } as unknown as Sandbox;

    const results = await PreviewReplay.capture(sandbox, {
        revision: "head",
        preview: {
            id: "replay-head",
            revision: "head",
            url: "http://127.0.0.1:41337",
            surfacePath: "/preview-replay-head",
            applicationPath: "/workspace/head/apps/web",
            browserAssets: [
                {
                    requestPath: "/_next/static/chunks/app.js",
                    sourcePath: "/workspace/head/apps/web/.next/static/chunks/app.js",
                    contentType: "application/javascript",
                },
            ],
        },
        plan: {
            applications: [{ id: "web", applicationPath: "apps/web", adapterId: "next" }],
            surfaces: [
                {
                    id: "billing",
                    applicationId: "web",
                    label: "Billing",
                    sourcePaths: ["app/billing/page.tsx"],
                    entry: { kind: "route", path: "/billing" },
                    rootLayoutMode: "inherit",
                    states: [
                        {
                            id: "default",
                            label: "Default",
                            scenarios: [
                                {
                                    id: "open",
                                    label: "Open",
                                    actions: [
                                        {
                                            kind: "click",
                                            selector: { role: "button", name: "Open" },
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                    viewports: [{ id: "desktop", label: "Desktop", width: 1280, height: 800 }],
                },
                {
                    id: "footer",
                    applicationId: "web",
                    label: "Footer",
                    sourcePaths: ["components/Footer.tsx"],
                    entry: { kind: "component", targetId: "footer" },
                    rootLayoutMode: "inherit",
                    states: [{ id: "default", label: "Default", scenarios: [] }],
                    viewports: [{ id: "mobile", label: "Mobile", width: 390, height: 844 }],
                },
            ],
        },
        artifactRoot: "/home/user/output/replay",
        dataPolicy: { sameOriginJsonPaths: ["/api/billing"] },
    });

    expect(results.map((result) => result.surfaceId)).toEqual(["billing", "footer"]);
    expect(results[0]).toMatchObject({
        resourceCount: 12,
        packageBytes: 8192,
        captureDurationMs: 1400,
        validationOutcome: "Verified",
        evidence: {
            scenarios: [expect.objectContaining({ id: "open", outcome: "Succeeded" })],
            dom: expect.objectContaining({ interactiveElementCount: 1 }),
            accessibility: expect.objectContaining({ labeledControlCount: 1 }),
            consoleDiagnostics: [],
            failedRequestDiagnostics: [],
        },
    });
    expect(requests).toHaveLength(2);
    expect(requests[0]).toMatchObject({
        url: "http://127.0.0.1:41337/billing",
        artifactRoot: "/home/user/output/replay/web/billing/default/desktop/head",
        scenario: {
            id: "billing-default",
            label: "Billing: Default",
            actions: [],
        },
        scenarios: [
            {
                id: "open",
                label: "Open",
                actions: [{ kind: "click", selector: { role: "button", name: "Open" } }],
            },
        ],
        browserAssets: [
            {
                requestPath: "/_next/static/chunks/app.js",
                sourcePath: "/workspace/head/apps/web/.next/static/chunks/app.js",
                contentType: "application/javascript",
            },
        ],
        policy: {
            sameOriginJsonPaths: ["/api/billing"],
        },
    });
    expect(requests[1]).toMatchObject({
        url: "http://127.0.0.1:41337/preview-replay-head/footer?state=default",
        artifactRoot: "/home/user/output/replay/web/footer/default/mobile/head",
    });
});

test("returns an unavailable result for one failed surface and continues with the next", async () => {
    let invocation = 0;
    const sandbox = {
        files: {
            write: async () => undefined,
            read: async () =>
                JSON.stringify({
                    artifactKey: "artifact.json",
                    fidelity: "Verified",
                    diagnostics: [],
                    resourceCount: 4,
                    packageBytes: 2048,
                    captureDurationMs: 900,
                    validationOutcome: "Verified",
                }),
        },
        commands: {
            run: async () => {
                invocation += 1;
                return invocation === 1
                    ? { exitCode: 1, stdout: "", stderr: "capture failed" }
                    : { exitCode: 0, stdout: "", stderr: "" };
            },
        },
    } as unknown as Sandbox;
    const sharedSurface = {
        applicationId: "web",
        label: "Surface",
        sourcePaths: ["app/page.tsx"],
        entry: { kind: "route" as const, path: "/" },
        rootLayoutMode: "inherit" as const,
        states: [{ id: "default", label: "Default", scenarios: [] }],
        viewports: [{ id: "desktop", label: "Desktop", width: 1280, height: 800 }],
    };

    const results = await PreviewReplay.capture(sandbox, {
        revision: "head",
        preview: {
            id: "replay-head",
            revision: "head",
            url: "http://127.0.0.1:41337",
            surfacePath: "/preview-replay-head",
            applicationPath: "/workspace/head/apps/web",
            browserAssets: [],
        },
        plan: {
            applications: [{ id: "web", applicationPath: "apps/web" }],
            surfaces: [
                { ...sharedSurface, id: "billing" },
                { ...sharedSurface, id: "footer" },
            ],
        },
        artifactRoot: "/home/user/output/replay",
    });

    expect(results.map((result) => result.fidelity)).toEqual(["Unavailable", "Verified"]);
});

test("names duplicate surface coordinates with their application identity", async () => {
    const requests: unknown[] = [];
    const sandbox = {
        files: {
            write: async (_path: string, contents: string) => {
                requests.push(JSON.parse(contents));
            },
            read: async () =>
                JSON.stringify({
                    artifactKey: "artifact.json",
                    fidelity: "Verified",
                    diagnostics: [],
                    resourceCount: 1,
                    packageBytes: 256,
                    captureDurationMs: 10,
                    validationOutcome: "Verified",
                }),
        },
        commands: { run: async () => ({ exitCode: 0, stdout: "", stderr: "" }) },
    } as unknown as Sandbox;
    const surface = {
        id: "dashboard",
        applicationId: "web",
        label: "Dashboard",
        sourcePaths: ["app/dashboard/page.tsx"],
        entry: { kind: "route" as const, path: "/dashboard" },
        rootLayoutMode: "inherit" as const,
        states: [{ id: "default", label: "Default", scenarios: [] }],
        viewports: [{ id: "desktop", label: "Desktop", width: 1280, height: 800 }],
    };

    const web = await PreviewReplay.capture(sandbox, {
        revision: "head",
        preview: {
            id: "web-head",
            revision: "head",
            url: "http://127.0.0.1:41337",
            surfacePath: "/preview-web",
            applicationPath: "/workspace/head/apps/web",
            browserAssets: [],
        },
        plan: {
            applications: [{ id: "web", applicationPath: "apps/web" }],
            surfaces: [surface],
        },
        artifactRoot: "/home/user/output/replay",
    });
    const admin = await PreviewReplay.capture(sandbox, {
        revision: "head",
        preview: {
            id: "admin-head",
            revision: "head",
            url: "http://127.0.0.1:41338",
            surfacePath: "/preview-admin",
            applicationPath: "/workspace/head/apps/admin",
            browserAssets: [],
        },
        plan: {
            applications: [{ id: "admin", applicationPath: "apps/admin" }],
            surfaces: [{ ...surface, applicationId: "admin" }],
        },
        artifactRoot: "/home/user/output/replay",
    });

    expect(web[0]).toMatchObject({
        applicationId: "web",
        artifactKey: "replay/web/dashboard/default/desktop/head/artifact.json",
    });
    expect(admin[0]).toMatchObject({
        applicationId: "admin",
        artifactKey: "replay/admin/dashboard/default/desktop/head/artifact.json",
    });
    expect(requests).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                artifactRoot: "/home/user/output/replay/web/dashboard/default/desktop/head",
            }),
            expect.objectContaining({
                artifactRoot: "/home/user/output/replay/admin/dashboard/default/desktop/head",
            }),
        ]),
    );
});
