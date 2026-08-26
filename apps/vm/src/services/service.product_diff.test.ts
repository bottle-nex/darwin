import { expect, test } from "bun:test";

import type { CapsuleSpec } from "./service.capsule_author";
import { collect_failures, MAX_REPAIR_ROUNDS, terminal_status } from "./service.product_diff";
import type { GateResults } from "./service.capsule_upload";

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

function gate(fidelity: "Verified" | "Partial" | "Failed", diagnostics: string[] = []) {
    return { capsuleId: "faq-item", fidelity, diagnostics };
}

test("nothing to repair when every revision rendered", () => {
    const gates: GateResults = {
        base: { "faq-item": gate("Verified") },
        head: { "faq-item": gate("Verified") },
    };
    expect(collect_failures([spec()], gates)).toEqual([]);
});

test("a partial render is not a failure, so it never costs a repair run", () => {
    const gates: GateResults = {
        base: { "faq-item": gate("Partial", ["Warning: missing key"]) },
        head: { "faq-item": gate("Verified") },
    };
    expect(collect_failures([spec()], gates)).toEqual([]);
});

test("a failed revision becomes one repair item carrying its diagnostics", () => {
    const gates: GateResults = {
        base: { "faq-item": gate("Verified") },
        head: { "faq-item": gate("Failed", ["TypeError: issues.map is not a function"]) },
    };
    expect(collect_failures([spec()], gates)).toEqual([
        {
            capsuleId: "faq-item",
            revision: "head",
            diagnostics: ["TypeError: issues.map is not a function"],
        },
    ]);
});

test("a revision the checker never reached counts as a failure", () => {
    const gates: GateResults = { base: {}, head: { "faq-item": gate("Verified") } };
    const failures = collect_failures([spec()], gates);

    expect(failures).toHaveLength(1);
    expect(failures[0]!.revision).toBe("base");
    expect(failures[0]!.diagnostics.join(" ")).toContain("did not build");
});

test("a revision the capsule never had is not a failure", () => {
    const added = spec({ change: "Added", entries: { base: false, head: true } });
    const gates: GateResults = { base: {}, head: { "faq-item": gate("Verified") } };
    expect(collect_failures([added], gates)).toEqual([]);
});

test("both sides failing produce two repair items", () => {
    const gates: GateResults = {
        base: { "faq-item": gate("Failed", ["boom"]) },
        head: { "faq-item": gate("Failed", ["boom"]) },
    };
    expect(collect_failures([spec()], gates)).toHaveLength(2);
});

test("the repair loop is bounded, so a stubborn capsule cannot run forever", () => {
    expect(MAX_REPAIR_ROUNDS).toBe(2);
});

test("a run with no capsules at all is unsupported, not failed", () => {
    expect(terminal_status({ version: 5, capsules: [], warnings: [] })).toBe("Unsupported");
});

test("a run that published at least one capsule is ready", () => {
    const manifest = {
        version: 5 as const,
        capsules: [
            {
                id: "faq-item",
                title: "FaqItem",
                componentPath: "apps/web/components/marketing/FaqItem.tsx",
                change: "Modified" as const,
                viewport: { width: 720, height: 240 },
                controls: [],
                base: null,
                head: { path: "head/faq-item/index.html", fidelity: "Failed" as const, diagnostics: ["boom"] },
            },
        ],
        warnings: [],
    };
    expect(terminal_status(manifest)).toBe("Ready");
});
