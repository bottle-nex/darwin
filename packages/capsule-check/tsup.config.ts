import { defineConfig } from "tsup";

/**
 * The sandbox runs this bundle from /opt/darwin/capsule-check, where the only installed dependency
 * is playwright. Anything left as an external import fails to resolve at runtime, so the shared
 * contract is bundled in rather than referenced.
 */
export default defineConfig({
    entry: ["src/index.ts"],
    platform: "node",
    format: ["esm"],
    noExternal: ["@trydarwin/types"],
});
