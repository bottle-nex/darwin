import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { promisify } from "node:util";

const run = promisify(execFile);

const QUERY_TIMEOUT_MS = 60_000;
const MAX_OUTPUT_BYTES = 4 * 1024 * 1024;
const MAX_ANSWER_CHARS = 12_000;
const PATH_FALLBACK = "/usr/local/bin:/usr/bin:/bin";

const FALLBACK_TO_GREP = "Fall back to Grep and Glob for this one.";

export default class GraphSearch {
    private static readonly GRAPH_PATH = process.env.MATCHA_GRAPH_PATH;

    public static async query(symbol: string): Promise<string> {
        const graph = GraphSearch.GRAPH_PATH;
        if (!graph || !existsSync(graph)) {
            return `No code graph was built for this run. ${FALLBACK_TO_GREP}`;
        }

        try {
            const { stdout } = await run("graphify", ["query", symbol, "--graph", graph], {
                timeout: QUERY_TIMEOUT_MS,
                maxBuffer: MAX_OUTPUT_BYTES,
                env: { ...process.env, PATH: process.env.PATH ?? PATH_FALLBACK },
            });

            const answer = stdout.trim();
            if (!answer) {
                return `The code graph has no node named "${symbol}". Check the spelling against the code, or ${FALLBACK_TO_GREP.toLowerCase()}`;
            }
            return GraphSearch.clamp(answer);
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            return `Code graph query failed: ${reason}. ${FALLBACK_TO_GREP}`;
        }
    }

    private static clamp(answer: string): string {
        if (answer.length <= MAX_ANSWER_CHARS) return answer;
        return `${answer.slice(0, MAX_ANSWER_CHARS)}\n\n[truncated — ${answer.length - MAX_ANSWER_CHARS} more characters. Ask a narrower question to see the rest.]`;
    }
}
