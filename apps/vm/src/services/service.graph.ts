import type { Sandbox } from "e2b";
import type Logger from "@trymatcha/logger";
import SandboxStream from "./service.sandbox_stream";

const REPO_DIR = "/home/user/repo";

/**
 * graphify writes its outputs to `<--out>/graphify-out/`. Pointing --out at the home directory
 * rather than the repo keeps graph.json out of the working tree the agent commits from.
 */
const GRAPH_OUT_ROOT = "/home/user";
export const GRAPH_PATH = `${GRAPH_OUT_ROOT}/graphify-out/graph.json`;

const BUILD_TIMEOUT_MS = 15 * 60_000;

export interface GraphBuild {
    commitSha: string;
    nodeCount: number;
    edgeCount: number;
    durationMs: number;
}

export default class GraphService {
    /**
     * Build the code graph for the repo in a sandbox, leaving it on disk for the agent to query.
     *
     * Nothing is persisted and nothing is read back into this process. The graph is derived data
     * — regenerable from the repo in seconds by a deterministic parser — so rebuilding it per
     * issue is cheaper than storing it, and it always matches the code actually in the sandbox
     * rather than whatever HEAD was at onboarding.
     *
     * `--code-only` is what keeps it free: tree-sitter AST parsing with no model call at all,
     * skipping the doc/PDF/image passes that would need an API key.
     */
    public static async build(
        sandbox: Sandbox,
        commit_sha: string,
        log: Logger,
    ): Promise<GraphBuild> {
        log.step("building code graph", { commit: commit_sha.slice(0, 7) });
        const started = Date.now();

        // The caller's logger rather than a "graph" scope: several workers build graphs
        // concurrently in this process, and the worker tag is what tells their output apart.
        const stream = SandboxStream.plain(log);
        let extract;
        try {
            extract = await sandbox.commands.run(
                `graphify extract ${REPO_DIR} --code-only --out ${GRAPH_OUT_ROOT}`,
                {
                    cwd: GRAPH_OUT_ROOT,
                    timeoutMs: BUILD_TIMEOUT_MS,
                    onStdout: stream.onStdout,
                    onStderr: stream.onStderr,
                },
            );
        } finally {
            stream.flush();
        }

        if (extract.exitCode !== 0) {
            throw new Error(
                `graphify extract failed (exit ${extract.exitCode}): ${extract.stderr}`,
            );
        }

        // Count in the sandbox rather than reading the graph back: this process never needs the
        // blob, and a large graph would be megabytes over the wire for two numbers.
        const counts = await sandbox.commands.run(
            `jq -r '[(.nodes | length), ((.links // .edges // []) | length)] | @tsv' ${GRAPH_PATH}`,
            { timeoutMs: 60_000 },
        );
        const [nodes, edges] = counts.stdout.trim().split(/\s+/);
        const nodeCount = Number(nodes);
        const edgeCount = Number(edges);

        if (!Number.isFinite(nodeCount) || nodeCount === 0) {
            throw new Error(
                `graphify produced an empty graph: ${extract.stdout || extract.stderr}`,
            );
        }

        const durationMs = Date.now() - started;
        log.success("code graph built", {
            nodes: nodeCount,
            edges: edgeCount,
            took: `${Math.round(durationMs / 1000)}s`,
        });

        return { commitSha: commit_sha, nodeCount, edgeCount, durationMs };
    }

    /**
     * The block that goes into the issue prompt.
     *
     * Deliberately small: it says what the graph knows and names the tool that reads it. The
     * graph itself stays on disk — inlining it would be paid for on every turn and would make
     * the solve more expensive, which is the opposite of the point.
     */
    public static prompt_section(build: GraphBuild): string {
        return `## Code graph

graphify mapped this repository at commit \`${build.commitSha.slice(0, 7)}\` — ${build.nodeCount} nodes, ${build.edgeCount} edges, built by tree-sitter AST parsing of the exact code in this sandbox. It knows where things are defined, what imports what, and what calls what.

Query it with the \`search_code\` tool, one identifier at a time, spelled exactly as the code spells it — \`Button\`, \`HostControls\`, \`useLiveQuizStore\`. It answers from the graph on disk, so it is fast and costs nothing; call it once per symbol you need. Do not phrase the query as a sentence: graphify seeds its traversal from the words you give it, so a sentence seeds it with your own filler and returns a subgraph that answers nothing.

Edges are tagged \`EXTRACTED\` when graphify saw the relationship in the source and \`INFERRED\` when it deduced one, so weigh them accordingly. The graph indexes code structure, not prose — for copy, comments, or a literal string in markup, Grep is still the right tool.`;
    }
}
