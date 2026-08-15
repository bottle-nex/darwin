# Graphify worker lifecycle

## Objective

Use Graphify's documented strict Claude integration in reusable E2B workers while keeping generated files out of customer commits.

## Decisions

- Pin Graphify `0.9.43` in the sandbox image.
- Run `graphify extract . --code-only` for cold and manifest-aware warm synchronization.
- Run `graphify install --project --strict` only after the first valid graph.
- Keep lifecycle state in `.git/matcha-graphify-state`; a failed graph disables Graphify for that sandbox.
- Restore the validated project base branch before claiming each issue.
- Preserve dirty failed sandboxes instead of discarding agent work.
- Protect root Graphify, Claude, and `.env` files locally through Git metadata; do not generate `.graphifyignore`.
- Use upstream Graphify directly; do not maintain a custom graph MCP tool or prompt.

## Validation

- `cd apps/vm && bun run lint && bun run typecheck`
- `cd packages/sandbox-mcp && bun run build && bun run typecheck`
- `cd apps/vm && bun run template:verify` verifies strict hooks, warm synchronization, and Git isolation without a Claude model call.
