import { expect, test } from "bun:test";

import { PRODUCT_DIFF_REPLAY_ARTIFACT_KEY_PATTERN } from "./product-diff.contract";

test("accepts only application-qualified replay artifact keys", () => {
    expect(
        PRODUCT_DIFF_REPLAY_ARTIFACT_KEY_PATTERN.test(
            "replay/web/dashboard/default/desktop/head/artifact.json",
        ),
    ).toBe(true);
    expect(
        PRODUCT_DIFF_REPLAY_ARTIFACT_KEY_PATTERN.test(
            "replay/dashboard/default/desktop/head/artifact.json",
        ),
    ).toBe(false);
    expect(
        PRODUCT_DIFF_REPLAY_ARTIFACT_KEY_PATTERN.test(
            "replay/web/../default/desktop/head/artifact.json",
        ),
    ).toBe(false);
});
