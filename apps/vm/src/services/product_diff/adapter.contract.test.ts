import { expect, test } from "bun:test";

import type { ProductDiffAdapter } from "./adapter.contract";
import ProductDiffAdapterRegistry from "./adapter.registry";

function adapter(id: string, supported: boolean): ProductDiffAdapter {
    return {
        id,
        detect: async () => ({
            supported,
            diagnostics: [],
        }),
        resolve_workspace: async () => ({ plan: null, diagnostics: [] }),
        prepare_revision: async ({ revision }) => ({
            revision,
            workspaceRoot: "/repo",
            generatedPaths: [],
        }),
        start_revision: async ({ revision }) => ({
            id: `${id}-${revision}`,
            revision,
            url: "http://127.0.0.1:3000",
            surfacePath: "/preview-run-a",
        }),
        verify_revision: async ({ preview }) => ({
            revision: preview.revision,
            ready: true,
            statusCode: 200,
            diagnostics: [],
        }),
        cleanup_revision: async () => undefined,
    };
}

test("returns the first adapter that supports a repository", async () => {
    const registry = new ProductDiffAdapterRegistry([
        adapter("unsupported", false),
        adapter("next", true),
        adapter("later", true),
    ]);

    const resolved = await registry.resolve({
        workspaceRoot: "/repo",
        changedPaths: [],
    });

    expect(resolved?.id).toBe("next");
});

test("returns null when no adapter supports a repository", async () => {
    const registry = new ProductDiffAdapterRegistry([adapter("unsupported", false)]);

    const resolved = await registry.resolve({
        workspaceRoot: "/repo",
        changedPaths: [],
    });

    expect(resolved).toBeNull();
});
