import type { CommandStartOpts, Sandbox } from "e2b";
import type Logger from "@trymatcha/logger";
import SandboxStream from "./service.sandbox_stream";

const REPO_DIR = "/home/user/repo";
const STATE_PATH = ".git/matcha-graphify-state";

const BUILD_TIMEOUT_MS = 15 * 60_000;

const PROTECT_COMMAND = `set -e
mkdir -p .git/info
touch .git/info/exclude
for path in /graphify-out/ /CLAUDE.md /.claude/CLAUDE.md '/.claude/settings.json*' /.claude/skills/graphify/ /.claudeignore /.env; do
    grep -qxF "$path" .git/info/exclude || printf '%s\n' "$path" >> .git/info/exclude
done
git ls-files -z -- ':(glob,top)graphify-out/**' ':(top,literal)CLAUDE.md' ':(top,literal).claude/CLAUDE.md' ':(glob,top).claude/settings.json*' ':(glob,top).claude/skills/graphify/**' ':(top,literal).claudeignore' ':(top,literal).env' |
git update-index -z --assume-unchanged --stdin
grep -qxF graphify-out/ .claudeignore 2>/dev/null || printf '\ngraphify-out/\n' >> .claudeignore`;

export default class GraphService {
    public static async protect(sandbox: Sandbox): Promise<void> {
        await GraphService.run_checked(sandbox, PROTECT_COMMAND);
    }

    public static async prepare(sandbox: Sandbox, log: Logger): Promise<"ready" | "disabled"> {
        try {
            const state = (
                await GraphService.run_checked(sandbox, `cat ${STATE_PATH} 2>/dev/null || true`)
            ).stdout.trim();
            if (state === "disabled") return state;

            const started = Date.now();
            log.step(state === "ready" ? "synchronizing code graph" : "building code graph");
            await GraphService.run_graphify(sandbox, "graphify extract . --code-only", log);
            await GraphService.run_checked(
                sandbox,
                "jq -e '(.nodes | length) > 0' graphify-out/graph.json",
                { timeoutMs: 60_000 },
            );

            if (state !== "ready") {
                await GraphService.run_graphify(
                    sandbox,
                    "graphify install --project --strict",
                    log,
                );
                await GraphService.run_checked(sandbox, `printf ready > ${STATE_PATH}`);
            }

            log.success("code graph ready", {
                took: `${Math.round((Date.now() - started) / 1000)}s`,
            });
            return "ready";
        } catch (error) {
            log.error("code graph unavailable — disabling Graphify", error);
            try {
                await GraphService.run_checked(sandbox, `printf disabled > ${STATE_PATH}`);
            } catch (persist_error) {
                log.error("could not persist disabled Graphify state", persist_error);
            }
            try {
                await GraphService.run_checked(sandbox, "rm -f graphify-out/graph.json");
            } catch (cleanup_error) {
                log.error("could not remove stale Graphify graph", cleanup_error);
            }
            return "disabled";
        }
    }

    private static async run_graphify(sandbox: Sandbox, command: string, log: Logger) {
        const stream = SandboxStream.plain(log);
        try {
            return await GraphService.run_checked(sandbox, command, {
                timeoutMs: BUILD_TIMEOUT_MS,
                onStdout: stream.onStdout,
                onStderr: stream.onStderr,
            });
        } finally {
            stream.flush();
        }
    }

    private static async run_checked(
        sandbox: Sandbox,
        command: string,
        options: CommandStartOpts & { background?: false } = {},
    ) {
        return sandbox.commands.run(command, { cwd: REPO_DIR, ...options, background: false });
    }
}
