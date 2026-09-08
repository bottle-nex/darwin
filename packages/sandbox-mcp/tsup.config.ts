import { defineConfig } from "tsup";

/**
 * The sandbox runs this bundle from /opt/darwin/sandbox-mcp, where the only installed
 * dependencies are the MCP SDK and zod. Anything left as an external import fails to resolve at
 * runtime — and a stdio MCP server that cannot start is invisible: the agent simply runs without
 * the tools, so the shared contract is bundled in rather than referenced.
 */
export default defineConfig({
    entry: ["src/index.ts"],
    platform: "node",
    format: ["esm"],
    noExternal: ["@trydarwin/types"],
});
