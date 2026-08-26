import { expect, test } from "bun:test";

import { grade_page, MIN_VISIBLE_HEIGHT_PX, type PageObservation } from "./gates";

function observation(overrides: Partial<PageObservation> = {}): PageObservation {
    return {
        mounted: true,
        timedOut: false,
        pageErrors: [],
        consoleErrors: [],
        renderedHeight: 120,
        visibleTextLength: 40,
        imageCount: 0,
        ...overrides,
    };
}

test("a clean page that painted something is verified", () => {
    const result = grade_page("faq-item", observation());
    expect(result).toEqual({ capsuleId: "faq-item", fidelity: "Verified", diagnostics: [] });
});

test("an uncaught error fails the page and reports the throw", () => {
    const result = grade_page(
        "faq-item",
        observation({ pageErrors: ["TypeError: Cannot read properties of undefined"] }),
    );
    expect(result.fidelity).toBe("Failed");
    expect(result.diagnostics[0]).toContain("TypeError");
});

test("a page whose root never filled is failed, not silently accepted", () => {
    const result = grade_page("faq-item", observation({ mounted: false }));
    expect(result.fidelity).toBe("Failed");
    expect(result.diagnostics.join(" ")).toContain("never mounted");
});

test("a page that hung past its timeout is failed", () => {
    const result = grade_page("faq-item", observation({ timedOut: true, mounted: false }));
    expect(result.fidelity).toBe("Failed");
    expect(result.diagnostics.join(" ")).toContain("timed out");
});

test("a mounted page that painted nothing visible is failed", () => {
    const result = grade_page(
        "faq-item",
        observation({ renderedHeight: MIN_VISIBLE_HEIGHT_PX - 1 }),
    );
    expect(result.fidelity).toBe("Failed");
    expect(result.diagnostics.join(" ")).toContain("rendered nothing visible");
});

test("a tall region holding no text and no images is still nothing visible", () => {
    const result = grade_page("faq-item", observation({ visibleTextLength: 0, imageCount: 0 }));
    expect(result.fidelity).toBe("Failed");
    expect(result.diagnostics.join(" ")).toContain("rendered nothing visible");
});

test("an image alone counts as something visible", () => {
    const result = grade_page("faq-item", observation({ visibleTextLength: 0, imageCount: 2 }));
    expect(result.fidelity).toBe("Verified");
});

test("a console error on a page that still painted is partial, not failed", () => {
    const result = grade_page(
        "faq-item",
        observation({ consoleErrors: ["Warning: Each child in a list needs a key"] }),
    );
    expect(result.fidelity).toBe("Partial");
    expect(result.diagnostics[0]).toContain("needs a key");
});

test("a blocked external asset leaves the page verified, because the sandbox blocked it", () => {
    const result = grade_page(
        "faq-item",
        observation({
            consoleErrors: [
                "Failed to load resource: net::ERR_NAME_NOT_RESOLVED",
                "Failed to load resource: the server responded with a status of 404 (Not Found)",
            ],
        }),
    );
    expect(result.fidelity).toBe("Verified");
    expect(result.diagnostics).toEqual([]);
});

test("diagnostics are capped so one noisy page cannot fill the manifest", () => {
    const noisy = Array.from({ length: 40 }, (_, index) => `console error ${index}`);
    const result = grade_page("faq-item", observation({ consoleErrors: noisy }));
    expect(result.diagnostics.length).toBeLessThanOrEqual(10);
});
