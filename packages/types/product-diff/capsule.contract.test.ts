import { expect, test } from "bun:test";

import {
    type Capsule,
    type CapsuleManifest,
    capsule_artifact_keys,
    is_capsule_manifest,
} from "./capsule.contract";

function capsule(overrides: Partial<Capsule> = {}): Capsule {
    return {
        id: "apps-web-components-faq-item",
        title: "FaqItem",
        componentPath: "apps/web/components/marketing/FaqItem.tsx",
        change: "Modified",
        viewport: { width: 720, height: 240 },
        controls: [],
        base: {
            path: "base/apps-web-components-faq-item/index.html",
            fidelity: "Verified",
            diagnostics: [],
        },
        head: {
            path: "head/apps-web-components-faq-item/index.html",
            fidelity: "Verified",
            diagnostics: [],
        },
        ...overrides,
    };
}

function manifest(capsules: Capsule[]): CapsuleManifest {
    return { version: 5, capsules, warnings: [] };
}

test("a null manifest yields no signable keys", () => {
    expect(capsule_artifact_keys(null).size).toBe(0);
});

test("a manifest with no capsules yields no signable keys", () => {
    expect(capsule_artifact_keys(manifest([])).size).toBe(0);
});

test("a modified capsule contributes both revision paths", () => {
    expect([...capsule_artifact_keys(manifest([capsule()]))].sort()).toEqual([
        "base/apps-web-components-faq-item/index.html",
        "head/apps-web-components-faq-item/index.html",
    ]);
});

test("a capsule added in this pull request contributes only its head path", () => {
    const added = capsule({ change: "Added", base: null });
    expect([...capsule_artifact_keys(manifest([added]))]).toEqual([
        "head/apps-web-components-faq-item/index.html",
    ]);
});

test("a capsule removed in this pull request contributes only its base path", () => {
    const removed = capsule({ change: "Removed", head: null });
    expect([...capsule_artifact_keys(manifest([removed]))]).toEqual([
        "base/apps-web-components-faq-item/index.html",
    ]);
});

test("a revision that failed to mount is still signable so the viewer can show it", () => {
    const broken = capsule({
        head: {
            path: "head/apps-web-components-faq-item/index.html",
            fidelity: "Failed",
            diagnostics: ["TypeError: Cannot read properties of undefined"],
        },
    });
    expect(capsule_artifact_keys(manifest([broken]))).toContain(
        "head/apps-web-components-faq-item/index.html",
    );
});

test("only version 5 manifests are recognised", () => {
    expect(is_capsule_manifest(manifest([]))).toBe(true);
    expect(is_capsule_manifest(null)).toBe(false);
    expect(is_capsule_manifest({ version: 4, surfaces: [] })).toBe(false);
    expect(is_capsule_manifest({ targets: [], warnings: [] })).toBe(false);
});
