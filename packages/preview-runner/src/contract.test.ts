import { expect, test } from "bun:test";

import { advisoryWarningsSchema } from "./contract";

test("adds an explicit warning when advisory input is truncated", () => {
    const warnings = advisoryWarningsSchema.parse([
        "x".repeat(401),
        ...Array.from({ length: 20 }, (_, index) => `warning-${index}`),
    ]);

    expect(warnings).toContain("advisory warnings were truncated to fit preview limits");
});
