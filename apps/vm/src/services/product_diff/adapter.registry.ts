import type { ProductDiffAdapter, ProductDiffAdapterDetectionInput } from "./adapter.contract";

export default class ProductDiffAdapterRegistry {
    private readonly adapters: readonly ProductDiffAdapter[];

    constructor(adapters: readonly ProductDiffAdapter[] = []) {
        this.adapters = adapters;
    }

    async resolve(input: ProductDiffAdapterDetectionInput): Promise<ProductDiffAdapter | null> {
        for (const adapter of this.adapters) {
            const detection = await adapter.detect(input);
            if (detection.supported) return adapter;
        }

        return null;
    }
}
