import { expect, test } from "bun:test";

import type { CapsuleSpec } from "./service.capsule_author";
import {
    artifact_content_type,
    build_manifest,
    type GateResults,
    plan_uploads,
    REVISION_BYTE_CAP,
} from "./service.capsule_upload";

function spec(overrides: Partial<CapsuleSpec> = {}): CapsuleSpec {
    return {
        id: "faq-item",
        title: "FaqItem",
        componentPath: "apps/web/components/marketing/FaqItem.tsx",
        change: "Modified",
        viewport: { width: 720, height: 240 },
        controls: [],
        entries: { base: true, head: true },
        ...overrides,
    };
}

const verified: GateResults = {
    base: { "faq-item": { capsuleId: "faq-item", fidelity: "Verified", diagnostics: [] } },
    head: { "faq-item": { capsuleId: "faq-item", fidelity: "Verified", diagnostics: [] } },
};

test("javascript is stored as javascript, or the browser refuses to run the module", () => {
    expect(artifact_content_type("assets/main.js")).toBe("text/javascript; charset=utf-8");
    expect(artifact_content_type("faq-item/index.html")).toBe("text/html; charset=utf-8");
    expect(artifact_content_type("assets/main.css")).toBe("text/css; charset=utf-8");
    expect(artifact_content_type("assets/inter.woff2")).toBe("font/woff2");
    expect(artifact_content_type("assets/blob.xyz")).toBe("application/octet-stream");
});

test("a modified capsule points at both revisions", () => {
    const manifest = build_manifest([spec()], verified, []);
    expect(manifest.capsules[0]!.base?.path).toBe("base/faq-item/index.html");
    expect(manifest.capsules[0]!.head?.path).toBe("head/faq-item/index.html");
    expect(manifest.version).toBe(5);
});

test("a capsule added in this pull request has no before side", () => {
    const added = spec({ change: "Added", entries: { base: false, head: true } });
    const manifest = build_manifest([added], { base: {}, head: verified.head }, []);

    expect(manifest.capsules[0]!.base).toBe(null);
    expect(manifest.capsules[0]!.head).not.toBe(null);
});

test("a capsule removed in this pull request has no after side", () => {
    const removed = spec({ change: "Removed", entries: { base: true, head: false } });
    const manifest = build_manifest([removed], { base: verified.base, head: {} }, []);

    expect(manifest.capsules[0]!.head).toBe(null);
    expect(manifest.capsules[0]!.base).not.toBe(null);
});

test("a failed gate lands on its own revision, carrying its diagnostic", () => {
    const gates: GateResults = {
        base: verified.base,
        head: {
            "faq-item": {
                capsuleId: "faq-item",
                fidelity: "Failed",
                diagnostics: ["TypeError: issues.map is not a function"],
            },
        },
    };
    const manifest = build_manifest([spec()], gates, []);

    expect(manifest.capsules[0]!.base?.fidelity).toBe("Verified");
    expect(manifest.capsules[0]!.head?.fidelity).toBe("Failed");
    expect(manifest.capsules[0]!.head?.diagnostics[0]).toContain("issues.map");
});

test("a revision the checker never reported is absent rather than pretended verified", () => {
    const manifest = build_manifest([spec()], { base: {}, head: verified.head }, []);
    expect(manifest.capsules[0]!.base).toBe(null);
});

test("a capsule with neither side is dropped and said out loud", () => {
    const manifest = build_manifest([spec()], { base: {}, head: {} }, []);
    expect(manifest.capsules).toHaveLength(0);
    expect(manifest.warnings.join(" ")).toContain("FaqItem");
});

test("earlier warnings survive into the manifest", () => {
    const manifest = build_manifest([spec()], verified, ["Card.tsx was skipped"]);
    expect(manifest.warnings).toContain("Card.tsx was skipped");
});

test("uploads stop at the byte cap and name what was left out", () => {
    const files = [
        { path: "head/a/index.html", bytes: REVISION_BYTE_CAP - 10 },
        { path: "head/b/index.html", bytes: 100 },
    ];
    const { upload, skipped } = plan_uploads(files);

    expect(upload.map((file) => file.path)).toEqual(["head/a/index.html"]);
    expect(skipped).toEqual(["head/b/index.html"]);
});

test("an ordinary bundle uploads whole", () => {
    const files = [
        { path: "head/a/index.html", bytes: 400 },
        { path: "head/assets/main.js", bytes: 200_000 },
    ];
    expect(plan_uploads(files).skipped).toHaveLength(0);
});
