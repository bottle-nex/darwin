import type { ProductDiffRootLayoutMode } from "@trymatcha/types";

import type { NextApplicationRouter } from "../../../service.preview_runner";

export default class NextPreviewLayoutPolicy {
    static attempt_modes(
        router: NextApplicationRouter,
        configuredMode: ProductDiffRootLayoutMode | null,
    ): ProductDiffRootLayoutMode[] {
        if (configuredMode) return [configuredMode];
        return router === "AppRouter" ? ["isolate", "inherit"] : ["inherit"];
    }
}
