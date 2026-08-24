import { expect, test } from "bun:test";

import { ADVISORY_WARNINGS_TRUNCATED, advisoryWarningsSchema } from "./contract";

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
