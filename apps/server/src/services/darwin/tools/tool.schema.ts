import z from "zod";

import type { DarwinTool } from "./tool.registry";

/**
 * Convert a tool's zod schema into the JSON Schema an OpenAI-compatible provider expects.
 *
 * Every option here is load-bearing. `draft-07` because GLM's validator rejects 2020-12's
 * `prefixItems`; `io: "input"` so a `.default()` renders as optional rather than baked in;
 * `reused: "inline"` so a shared sub-schema never emits `$defs`/`$ref`, which several providers
 * silently drop. `$schema` is stripped because it is not part of the `function.parameters`
 * contract and some providers reject unknown top-level keys.
 *
 * Because `unrepresentable: "any"` degrades instead of throwing, a schema using `.transform()`,
 * `z.date()` or `z.coerce.*` silently becomes a useless `{}`. Keep tool schemas to plain types
 * and convert inside `run`.
 *
 * @example
 * json_schema_for(find_issues_tool);
 * // { type: "object", properties: { assignees: {...} }, additionalProperties: false }
 */
export function json_schema_for(tool: DarwinTool): Record<string, unknown> {
    const { $schema: _unused, ...schema } = z.toJSONSchema(tool.input, {
        target: "draft-07",
        io: "input",
        unrepresentable: "any",
        reused: "inline",
    }) as Record<string, unknown>;
    return schema;
}
