import type { ProductDiffManifestV4 } from "@trymatcha/types";
import { describe, expect, test } from "bun:test";

import {
    replay_evidence_sections,
    select_replay_application,
    select_replay_artifacts,
    select_replay_state,
    select_replay_surface,
    select_replay_viewport,
} from "./product-diff-replay";

const manifest: ProductDiffManifestV4 = {
    version: 4,
    framework: "NextAppRouter",
    applications: [
        { id: "marketing", applicationPath: "apps/marketing", adapterId: "next" },
        { id: "dashboard", applicationPath: "apps/dashboard", adapterId: "next" },
    ],
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
                                diagnostics: ["Request data was unavailable"],
                            },
                        },
                    ],
                },
            ],
        },
        {
            id: "home",
            applicationId: "dashboard",
            label: "Home",
            states: [],
        },
    ],
    warnings: [],
};

describe("replay manifest selection", () => {
    test("builds bounded review evidence sections for the selected revision", () => {
        const sections = replay_evidence_sections({
            artifactKey: "replay/marketing/pricing/default/desktop/head/artifact.json",
            fidelity: "Partial",
            diagnostics: [],
            evidence: {
                scenarios: [
                    {
                        id: "open-menu",
                        label: "Open menu",
                        outcome: "Succeeded",
                        actions: [{ index: 0, kind: "click", outcome: "Succeeded" }],
                    },
                ],
                dom: { elementCount: 42, interactiveElementCount: 4, visibleTextLength: 320 },
                accessibility: {
                    landmarkCount: 3,
                    headingCount: 2,
                    labeledControlCount: 4,
                    unlabeledControlCount: 0,
                },
                consoleDiagnostics: ["console error was redacted"],
                failedRequestDiagnostics: ["https://api.example.test/items"],
            },
        });

        expect(sections).toEqual([
            { label: "Scenarios", values: ["Open menu · Succeeded"] },
            {
                label: "DOM",
                values: ["42 elements · 4 interactive · 320 visible characters"],
            },
            {
                label: "Accessibility",
                values: ["3 landmarks · 2 headings · 4 labeled controls · 0 unlabeled controls"],
            },
            { label: "Console", values: ["console error was redacted"] },
            { label: "Failed requests", values: ["https://api.example.test/items"] },
        ]);
    });

    test("selects a surface only within its application", () => {
        expect(
            select_replay_surface(manifest, { applicationId: "marketing", surfaceId: "pricing" }),
        ).toEqual(expect.objectContaining({ id: "pricing", applicationId: "marketing" }));
        expect(
            select_replay_surface(manifest, { applicationId: "dashboard", surfaceId: "pricing" }),
        ).toBeUndefined();
    });

    test("selects the application, state, and viewport from one replay hierarchy", () => {
        const application = select_replay_application(manifest, "marketing");
        const surface = select_replay_surface(manifest, {
            applicationId: application?.id ?? "",
            surfaceId: "pricing",
        });
        const state = select_replay_state(surface, "default");

        expect(application).toEqual(
            expect.objectContaining({ id: "marketing", applicationPath: "apps/marketing" }),
        );
        expect(state).toEqual(expect.objectContaining({ id: "default" }));
        expect(select_replay_viewport(state, "desktop")).toEqual(
            expect.objectContaining({ id: "desktop", width: 1280, height: 800 }),
        );
    });

    test("finds the selected viewport's matching base and head descriptors", () => {
        const selection = {
            applicationId: "marketing",
            surfaceId: "pricing",
            stateId: "default",
            viewportId: "desktop",
        };

        expect(select_replay_artifacts(manifest, selection)).toEqual({
            base: expect.objectContaining({
                artifactKey: "replay/marketing/pricing/default/desktop/base/artifact.json",
                fidelity: "Verified",
            }),
            head: expect.objectContaining({
                artifactKey: "replay/marketing/pricing/default/desktop/head/artifact.json",
                fidelity: "Partial",
            }),
        });
    });

    test("does not select a viewport from a different state", () => {
        const surface = select_replay_surface(manifest, {
            applicationId: "marketing",
            surfaceId: "pricing",
        });

        expect(select_replay_viewport(surface?.states[0], "mobile")).toBeUndefined();
    });
});
