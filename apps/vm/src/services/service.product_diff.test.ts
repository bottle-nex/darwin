import { expect, test } from "bun:test";

import { product_diff_failure_status } from "./service.product_diff";

test("maps preview startup and browser-validation failures to PreviewUnavailable", () => {
    expect(product_diff_failure_status("start head dev server")).toBe("PreviewUnavailable");
    expect(product_diff_failure_status("verify the base preview surface")).toBe(
        "PreviewUnavailable",
    );
    expect(product_diff_failure_status("run the harness agent")).toBe("Failed");
});
