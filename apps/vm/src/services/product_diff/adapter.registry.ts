import type Logger from "@trymatcha/logger";
import type { Sandbox } from "e2b";

import type { ProductDiffAdapter, ProductDiffAdapterDetectionInput } from "./adapter.contract";
import NextProductDiffAdapter from "./adapters/next/service.next_product_diff_adapter";

export interface ProductDiffAdapterRuntime {
    sandbox: Sandbox;
    projectId: string;
    log: Logger;
    environment: Record<string, string>;
}

export default class ProductDiffAdapterRegistry {
    private readonly adapters: readonly ProductDiffAdapter[];

    constructor(adapters: readonly ProductDiffAdapter[] = []) {
        this.adapters = adapters;
    }

    static registered(input: ProductDiffAdapterRuntime): ProductDiffAdapterRegistry {
        return new ProductDiffAdapterRegistry([new NextProductDiffAdapter(input)]);
    }

    async resolve(input: ProductDiffAdapterDetectionInput): Promise<ProductDiffAdapter | null> {
        for (const adapter of this.adapters) {
            const detection = await adapter.detect(input);
            if (detection.supported) return adapter;
        }

        return null;
    }
}
