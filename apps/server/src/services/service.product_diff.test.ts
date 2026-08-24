import { expect, test } from "bun:test";

import ProductDiffService from "./service.product_diff";

test("retryable_product_diff_status excludes configuration-required runs", () => {
    expect(ProductDiffService.retryable_product_diff_status("PreviewUnavailable")).toBe(true);
    expect(ProductDiffService.retryable_product_diff_status("ConfigurationRequired")).toBe(false);
});
