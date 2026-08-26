import { expect, test } from "bun:test";

import {
    is_replay_product_diff_manifest,
    replayArtifactKeys,
} from "../../types/product-diff/product-diff.contract";
import type { ProductDiffManifestV4 } from "../../types/product-diff/product-diff.contract";

import {
    ADVISORY_WARNINGS_TRUNCATED,
    advisoryWarningsSchema,
    harnessManifestSchema,
    replayReviewPlanSchema,
} from "./contract";

const target = {
    id: "header-nav",
    label: "Header navigation",
    sourcePath: "components/HeaderNav.tsx",
    states: [{ id: "default", label: "Default" }],
};

function replayPlan() {
    return {
        applications: [{ id: "web", applicationPath: "apps/web" }],
        surfaces: [
            {
                id: "dashboard",
                applicationId: "web",
                label: "Dashboard",
                sourcePaths: ["app/dashboard/page.tsx"],
                entry: { kind: "route" as const, path: "/dashboard" },
                rootLayoutMode: "inherit" as const,
                states: [
                    {
                        id: "default",
                        label: "Default",
                        scenarios: [{ id: "open", label: "Open", actions: [] }],
                    },
                ],
                viewports: [{ id: "desktop", label: "Desktop", width: 1280, height: 800 }],
            },
        ],
    };
}

test("adds an explicit warning when advisory input is truncated", () => {
    const warnings = advisoryWarningsSchema.parse([
        "x".repeat(401),
        ...Array.from({ length: 20 }, (_, index) => `warning-${index}`),
    ]);

    expect(warnings).toContain("advisory warnings were truncated to fit preview limits");
});

test("reserves a warning slot for the truncation sentinel", () => {
    const warnings = advisoryWarningsSchema.parse(
        Array.from({ length: 21 }, (_, index) => `warning-${index}`),
    );

    expect(warnings).toHaveLength(20);
    expect(warnings.at(-1)).toBe(ADVISORY_WARNINGS_TRUNCATED);
    expect(warnings).toContain("warning-18");
    expect(warnings).not.toContain("warning-19");
});

test("accepts a legacy manifest root layout field without requiring it", () => {
    const legacyManifest = harnessManifestSchema.parse({
        rootLayoutMode: "inherit",
        targets: [target],
        warnings: [],
    });
    const manifestWithoutLayoutMode = harnessManifestSchema.parse({
        targets: [target],
        warnings: [],
    });

    expect(legacyManifest.rootLayoutMode).toBe("inherit");
    expect(manifestWithoutLayoutMode.rootLayoutMode).toBe("inherit");
});

test("accepts a bounded declarative replay review plan", () => {
    const plan = replayReviewPlanSchema.parse({
        applications: [{ id: "marketing", applicationPath: "apps/marketing", adapterId: "next" }],
        surfaces: [
            {
                id: "pricing",
                applicationId: "marketing",
                label: "Pricing",
                sourcePaths: ["app/pricing/page.tsx"],
                entry: { kind: "route", path: "/pricing" },
                rootLayoutMode: "inherit",
                states: [{ id: "default", label: "Default", scenarios: [] }],
                viewports: [{ id: "desktop", label: "Desktop", width: 1280, height: 800 }],
            },
        ],
    });

    expect(plan.surfaces).toHaveLength(1);
});

test("rejects agent-authored replay data policy from the review plan", () => {
    const parsed = replayReviewPlanSchema.safeParse({
        applications: [{ id: "marketing", applicationPath: "apps/marketing" }],
        surfaces: [
            {
                id: "pricing",
                applicationId: "marketing",
                label: "Pricing",
                sourcePaths: ["app/pricing/page.tsx"],
                entry: { kind: "route", path: "/pricing" },
                rootLayoutMode: "inherit",
                states: [{ id: "default", label: "Default", scenarios: [] }],
                viewports: [{ id: "desktop", label: "Desktop", width: 1280, height: 800 }],
            },
        ],
        replayDataPolicy: { sameOriginJsonPaths: ["/api/private"] },
    });

    expect(parsed.success).toBe(false);
});

test("accepts the same surface coordinate in distinct applications", () => {
    const plan = replayPlan();
    plan.applications.push({ id: "admin", applicationPath: "apps/admin" });
    plan.surfaces.push({
        ...structuredClone(plan.surfaces[0]!),
        applicationId: "admin",
    });

    expect(replayReviewPlanSchema.safeParse(plan).success).toBe(true);
});

test("scopes state viewport and scenario identifiers below their owning coordinates", () => {
    const plan = replayPlan();
    plan.surfaces.push({
        ...structuredClone(plan.surfaces[0]!),
        id: "settings",
    });
    plan.surfaces[0]!.states.push({
        ...structuredClone(plan.surfaces[0]!.states[0]!),
        id: "expanded",
    });

    expect(replayReviewPlanSchema.safeParse(plan).success).toBe(true);
});

test("rejects duplicate application identifiers", () => {
    const plan = replayPlan();
    plan.applications.push({ id: "web", applicationPath: "apps/admin" });

    expect(replayReviewPlanSchema.safeParse(plan).success).toBe(false);
});

test("rejects duplicate surface identifiers within one application", () => {
    const plan = replayPlan();
    plan.surfaces.push(structuredClone(plan.surfaces[0]!));

    expect(replayReviewPlanSchema.safeParse(plan).success).toBe(false);
});

test("rejects duplicate state identifiers within one surface", () => {
    const plan = replayPlan();
    plan.surfaces[0]!.states.push(structuredClone(plan.surfaces[0]!.states[0]!));

    expect(replayReviewPlanSchema.safeParse(plan).success).toBe(false);
});

test("rejects duplicate viewport identifiers within one surface", () => {
    const plan = replayPlan();
    plan.surfaces[0]!.viewports.push(structuredClone(plan.surfaces[0]!.viewports[0]!));

    expect(replayReviewPlanSchema.safeParse(plan).success).toBe(false);
});

test("rejects duplicate scenario identifiers within one state", () => {
    const plan = replayPlan();
    plan.surfaces[0]!.states[0]!.scenarios.push(
        structuredClone(plan.surfaces[0]!.states[0]!.scenarios[0]!),
    );

    expect(replayReviewPlanSchema.safeParse(plan).success).toBe(false);
});

test("recognizes V4 replay artifacts and collects their keys", () => {
    const manifest: ProductDiffManifestV4 = {
        version: 4,
        framework: "NextAppRouter",
        applications: [{ id: "marketing", applicationPath: "apps/marketing", adapterId: "next" }],
        surfaces: [
            {
                id: "pricing",
                applicationId: "marketing",
                label: "Pricing",
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
                                    artifactKey:
                                        "replay/marketing/pricing/default/desktop/base/artifact.json",
                                    fidelity: "Verified",
                                    diagnostics: [],
                                },
                                head: {
                                    artifactKey:
                                        "replay/marketing/pricing/default/desktop/head/artifact.json",
                                    fidelity: "Partial",
                                    diagnostics: ["Missing response"],
                                },
                            },
                        ],
                    },
                ],
            },
        ],
        warnings: [],
    };

    expect(is_replay_product_diff_manifest(manifest)).toBe(true);
    expect(replayArtifactKeys(manifest)).toEqual(
        new Set([
            "replay/marketing/pricing/default/desktop/base/artifact.json",
            "replay/marketing/pricing/default/desktop/head/artifact.json",
        ]),
    );
});
