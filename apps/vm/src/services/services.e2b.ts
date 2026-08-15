import { CommandResult, Sandbox, SnapshotInfo } from "e2b";
import { ENV } from "../conf/config.env";
import GithubService from "./service.github";
import SecretService from "./service.secret";
import PlanService from "./services.plan";
import GraphService, {
    GRAPHIFY_INTEGRATION,
    GRAPHIFY_OUT,
    GRAPHIFY_SETTINGS,
} from "./service.graph";
import ClaudeRun from "./service.claude_run";
import SandboxStream, { redact } from "./service.sandbox_stream";
import { sign_worker_jwt } from "./service.jwt";
import IssueSolver, { type ClaimedIssue } from "./service.issue_solver";
import Logger, { format_duration } from "@trymatcha/logger";
import { prisma, WorkerStatus } from "@trymatcha/database";

const REPO_DIR = "/home/user/repo";
const SAFE_BRANCH = /^[A-Za-z0-9._/-]+$/;
const SANDBOX_TIMEOUT_MS = 15 * 60_000;
// E2B rejects sandbox creation above 1 hour outright ("Timeout cannot be greater than 1
// hours") — this is a hard platform cap, not a tunable. A worker loop that legitimately
// needs longer than this to get through its queued issues will have its sandbox killed
// mid-run; there's no keep-alive/extend wired up yet, so a long-running loop is a known
// gap, not something this constant can paper over.
const WORKER_SANDBOX_TIMEOUT_MS = 55 * 60_000;
const CLONE_TIMEOUT_MS = 10 * 60_000;
const ISSUE_PROMPT_PATH = "/home/user/issue_prompt.txt";
const MCP_CONFIG_PATH = "/home/user/matcha_mcp_config.json";
const SANDBOX_MCP_ENTRY = "/opt/matcha/sandbox-mcp/index.js";
const ISSUE_SOLVE_TIMEOUT_MS = 30 * 60_000;

export default class E2B {
    public static async run_onboarding_job(
        session_id: string,
        project_id: string,
        github_repo_url: string,
        branch: string,
        installation_id: number,
    ) {
        const log = Logger.scope("onboard");
        let sandbox_id: string | null = null;
        log.step("onboarding started", {
            session: session_id,
            repo: github_repo_url,
            branch,
        });
        try {
            await Promise.all([
                prisma.setupSession.update({
                    where: { id: session_id },
                    data: { status: "Provisioning" },
                }),
                PlanService.mark_generating(project_id),
            ]);

            sandbox_id = await E2B.create();
            log.info("sandbox created", { sandbox: sandbox_id });
            await prisma.setupSession.update({
                where: { id: session_id },
                data: { sandboxId: sandbox_id, status: "Cloning" },
            });

            await E2B.clone_repo(
                sandbox_id,
                github_repo_url,
                branch,
                installation_id,
                project_id,
                log,
            );
            const commit_sha = await E2B.head_commit(sandbox_id);
            log.info("repo cloned", { commit: commit_sha.slice(0, 7) });

            await prisma.setupSession.update({
                where: { id: session_id },
                data: { status: "Detecting" },
            });

            console.log("cloned the repo and now generating the brief for the repo");
            // const brief = await PlanService.generate_plan(sandbox_id);
            // console.log(chalk.green("brief is : "), brief);
            // await PlanService.set_plan(project_id, brief.planMd, commit_sha);
            // await ConsumptionLog.record({
            //     stage: "onboard",
            //     phase: "brief",
            //     repo: github_repo_url,
            //     issue: "—",
            //     model: brief.model,
            //     effort: brief.effort,
            //     cost_usd: brief.costUsd,
            //     num_turns: brief.numTurns,
            //     duration_ms: brief.durationMs,
            //     outcome: `brief generated @ ${commit_sha.slice(0, 7)}`,
            // });

            await prisma.setupSession.update({
                where: { id: session_id },
                data: { status: "Ready", finishedAt: new Date() },
            });
            log.success("onboarding ready", { session: session_id });
        } catch (error) {
            log.error("onboarding failed", error, { session: session_id });
            try {
                await Promise.all([
                    prisma.setupSession.update({
                        where: { id: session_id },
                        data: {
                            status: "Failed",
                            error: error instanceof Error ? error.message : String(error),
                            finishedAt: new Date(),
                        },
                    }),
                    PlanService.mark_failed(project_id),
                ]);
            } catch (e) {
                log.error("could not mark session Failed", e, { session: session_id });
            }
        } finally {
            if (sandbox_id) {
                try {
                    await E2B.destroy(sandbox_id);
                    log.info("sandbox destroyed", { sandbox: sandbox_id });
                } catch (e) {
                    log.error("sandbox teardown failed", e, { sandbox: sandbox_id });
                }
            }
        }
    }

    /**
     * Drives a worker end to end: boot (or reuse) its sandbox, then loop claiming the
     * next Queued issue assigned to it, pushing it into the sandbox as a fresh `claude -p`
     * invocation, waiting for the PR, and repeating — until no Queued issue is left, at
     * which point the worker goes Idle. This is what the IssueVm dispatch consumer calls;
     * re-dispatching an already-running worker is a no-op via the queue's per-worker jobId,
     * and this method's own re-claim loop is what actually picks up any issue added while
     * it's mid-run, so a fresh dispatch isn't needed for that case either.
     *
     * Per-issue outcome (PR opened, which issue) is reported by Claude itself over
     * sandbox-mcp, since only the sandbox knows the PR URL. The Busy/Idle transition is
     * written directly to the db here instead — this process is the one polling the
     * queue and already knows definitively when it's empty.
     *
     * Simplification: the sandbox is always torn down once the loop empties, even though
     * more issues could get routed to this worker later (a subsequent run just boots a
     * fresh one and re-clones). Warm-resume via E2B snapshot/pause is possible later using
     * `take_snapshot`/`pause` below, but isn't wired up yet.
     */
    public static async run_worker_loop(worker_id: string): Promise<void> {
        const log = Logger.scope(`vm:${worker_id.slice(-8)}`);
        const worker = await prisma.worker.findUniqueOrThrow({
            where: { id: worker_id },
            include: { project: { include: { githubInstallation: true } } },
        });

        const { project } = worker;
        if (!project.githubRepoUrl || !project.githubDefaultBranch || !project.githubInstallation) {
            log.error(
                "project is missing repo url / default branch / github installation — marking worker Dead",
                undefined,
                { worker: worker_id, project: project.id },
            );
            await prisma.worker.update({
                where: { id: worker_id },
                data: { status: WorkerStatus.Dead },
            });
            return;
        }

        const repo_url = project.githubRepoUrl;
        const branch = project.githubDefaultBranch;
        const installation_id = Number(project.githubInstallation.installationId);
        validate_branch(branch);

        let sandbox_id = worker.sandboxId;
        let preserve_sandbox = false;
        log.step("worker loop starting", { worker: worker_id, project: project.id, branch });

        try {
            if (!sandbox_id) {
                log.info("no live sandbox — creating one");
                sandbox_id = await E2B.create(WORKER_SANDBOX_TIMEOUT_MS);
                log.info("sandbox created", { sandbox: sandbox_id });
                await prisma.worker.update({
                    where: { id: worker_id },
                    data: { sandboxId: sandbox_id },
                });

                log.info("cloning repo into sandbox", { repo: repo_url });
                await E2B.clone_repo(
                    sandbox_id,
                    repo_url,
                    branch,
                    installation_id,
                    project.id,
                    log,
                );
                log.info("clone complete");
            } else {
                log.info("reusing live sandbox", { sandbox: sandbox_id });
            }

            const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.SERVER_E2B_API_KEY });

            const [gh_token, worker_token] = await Promise.all([
                GithubService.getInstallationToken(installation_id),
                Promise.resolve(sign_worker_jwt(worker_id)),
            ]);
            log.info("minted github + worker tokens for the sandbox");

            const mcp_config = {
                mcpServers: {
                    matcha: {
                        command: "node",
                        args: [SANDBOX_MCP_ENTRY],
                        env: {
                            MATCHA_SERVER_URL: ENV.SERVER_PUBLIC_API_URL,
                            MATCHA_SANDBOX_TOKEN: worker_token,
                            MATCHA_SESSION_KIND: "worker",
                        },
                    },
                },
            };
            await sandbox.files.write(MCP_CONFIG_PATH, JSON.stringify(mcp_config, null, 2));
            log.info("wrote mcp config into sandbox");

            log.info("worker marked Busy");
            await prisma.worker.update({
                where: { id: worker_id },
                data: { status: WorkerStatus.Busy },
            });

            const model = ENV.SERVER_SOLVE_MODEL;
            const effort = ENV.SERVER_SOLVE_EFFORT;
            let solved_count = 0;

            for (;;) {
                const worktree = await sandbox.commands.run("git status --porcelain", {
                    cwd: REPO_DIR,
                });
                if (worktree.stdout.trim()) {
                    preserve_sandbox = true;
                    throw new Error("worker checkout is dirty — preserving sandbox for recovery");
                }
                await sandbox.commands.run(`git switch ${branch}`, { cwd: REPO_DIR });

                const issue = await IssueSolver.claim_next_issue(worker_id, log);
                if (!issue) {
                    log.success("queue empty — stopping loop", { solved: solved_count });
                    break;
                }

                const graph_state = await GraphService.prepare(sandbox, log);

                log.step(`issue #${issue.number} pushed into sandbox`, { title: issue.title });
                await sandbox.files.write(
                    ISSUE_PROMPT_PATH,
                    E2B.build_issue_prompt(issue, branch, project.planMd),
                );

                log.info(`invoking claude for issue #${issue.number}`, {
                    model,
                    effort,
                    brief: project.planMd ? "included" : "absent",
                });

                let report;
                try {
                    report = await ClaudeRun.execute(sandbox, log, {
                        prompt_path: ISSUE_PROMPT_PATH,
                        model,
                        effort,
                        extra_flags: [
                            `--mcp-config ${MCP_CONFIG_PATH}`,
                            ...(graph_state === "ready"
                                ? [
                                      `--settings ${GRAPHIFY_SETTINGS}`,
                                      `--add-dir ${GRAPHIFY_INTEGRATION}`,
                                  ]
                                : []),
                        ],
                        envs: {
                            CLAUDE_CODE_OAUTH_TOKEN: ENV.SERVER_CLAUDE_CODE_OAUTH_TOKEN,
                            GH_TOKEN: gh_token,
                            ...(graph_state === "ready" ? { GRAPHIFY_OUT } : {}),
                        },
                        timeout_ms: ISSUE_SOLVE_TIMEOUT_MS,
                        label: `solving agent for issue #${issue.number}`,
                    });
                } catch (error) {
                    preserve_sandbox = await sandbox.commands
                        .run("git status --porcelain", {
                            cwd: REPO_DIR,
                        })
                        .then((worktree) => Boolean(worktree.stdout.trim()))
                        .catch((inspection_error) => {
                            log.error("could not inspect failed solver worktree", inspection_error);
                            return true;
                        });
                    throw error;
                }

                log.success(`issue #${issue.number} run finished`, {
                    turns: report.num_turns,
                    cost_usd: report.total_cost_usd.toFixed(4),
                    duration: format_duration(report.duration_ms),
                });
                log.block("final message from claude", report.result ?? "(empty)");
                solved_count++;
            }

            log.info("worker marked Idle");
            await prisma.worker.update({
                where: { id: worker_id },
                data: { status: WorkerStatus.Idle },
            });
        } catch (error) {
            log.error("worker loop failed", error, { worker: worker_id });
            try {
                await prisma.worker.update({
                    where: { id: worker_id },
                    data: {
                        status: WorkerStatus.Dead,
                        contextSummary: {
                            error: error instanceof Error ? error.message : String(error),
                            failedAt: new Date().toISOString(),
                        },
                    },
                });
                log.warn("worker marked Dead after failure");
            } catch (e) {
                log.error("could not mark worker Dead", e, { worker: worker_id });
            }
        } finally {
            if (sandbox_id && preserve_sandbox) {
                log.warn("preserving dirty sandbox for recovery", { sandbox: sandbox_id });
            } else if (sandbox_id) {
                log.info("tearing down sandbox", { sandbox: sandbox_id });
                try {
                    await E2B.destroy(sandbox_id);
                    await prisma.worker.update({
                        where: { id: worker_id },
                        data: { sandboxId: null },
                    });
                    log.info("sandbox destroyed");
                } catch (e) {
                    log.error("sandbox teardown failed", e, { sandbox: sandbox_id });
                }
            }
        }
    }

    private static build_issue_prompt(
        issue: ClaimedIssue,
        base_branch: string,
        plan_md: string | null,
    ): string {
        const intro = `You are an autonomous coding agent working inside a fresh clone of this repository at ${REPO_DIR}, currently on branch "${base_branch}".`;

        const brief = plan_md
            ? `## Project brief

An earlier agent explored this repository and wrote the brief below. Lean on it to orient yourself instead of rediscovering the layout from scratch. It was written against an earlier commit, so confirm anything you depend on before acting on it.

${plan_md}`
            : null;

        const issue_section = `## Issue #${issue.number}: ${issue.title}

${issue.description}`;

        const actions = [
            `Investigate the issue and read every relevant file before changing it.`,
            `Create a new git branch off "${base_branch}" (never commit directly to "${base_branch}"). Pick a short, descriptive branch name.`,
            `Implement the fix using your normal tools.`,
            `Commit your changes with a clear commit message.`,
            `Push the branch and open a pull request against "${base_branch}" using the gh CLI (already authenticated via GH_TOKEN). Write a clear PR title and description referencing issue #${issue.number}.`,
            `Call the report_pr_opened MCP tool with issue_id "${issue.id}", the PR URL, the branch name, and a one-sentence summary of the change.`,
        ];

        const steps = `## What to do, in this exact order

${actions.map((action, index) => `${index + 1}. ${action}`).join("\n")}

Do all of this yourself with your Bash tool — you have full permissions in this sandbox.

Never start a long-running command in the background and end your turn waiting on it. This is a single non-interactive run: there is no later turn to come back to, so anything left running when you stop is lost and the issue goes unsolved. Run it in the foreground and wait for it to finish.`;

        return [intro, brief, issue_section, steps].filter(Boolean).join("\n\n");
    }

    public static async head_commit(sandbox_id: string): Promise<string> {
        const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.SERVER_E2B_API_KEY });
        const result = await sandbox.commands.run("git rev-parse HEAD", { cwd: REPO_DIR });
        return result.stdout.trim();
    }

    public static async create(timeout_ms: number = SANDBOX_TIMEOUT_MS): Promise<string> {
        const sandbox = await Sandbox.create("node-py-claude-template", {
            apiKey: ENV.SERVER_E2B_API_KEY,
            timeoutMs: timeout_ms,
        });
        return sandbox.sandboxId;
    }

    public static async exec_command(sandbox_id: string, command: string): Promise<CommandResult> {
        const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.SERVER_E2B_API_KEY });
        const result = await sandbox.commands.run(command);
        return result;
    }

    public static async exec_js_code(sandbox_id: string, code: string): Promise<string> {
        const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.SERVER_E2B_API_KEY });
        const result = await sandbox.commands.run(`node -e '${code}'`);
        return result.stdout;
    }

    public static async take_snapshot(sandbox_id: string): Promise<SnapshotInfo> {
        const snapshot = await Sandbox.createSnapshot(sandbox_id, {
            apiKey: ENV.SERVER_E2B_API_KEY,
        });
        return snapshot;
    }

    public static async pause(sandbox_id: string): Promise<boolean> {
        const status = await Sandbox.pause(sandbox_id, { apiKey: ENV.SERVER_E2B_API_KEY });
        return status;
    }

    public static async destroy(sandbox_id: string): Promise<void> {
        const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.SERVER_E2B_API_KEY });
        await sandbox.kill();
    }

    public static async clone_repo(
        sandbox_id: string,
        repo_url: string,
        branch: string,
        installation_id: number,
        project_id: string,
        log: Logger,
    ) {
        validate_branch(branch);

        const [token, secrets] = await Promise.all([
            GithubService.getInstallationToken(installation_id),
            SecretService.get_all_secrets(project_id),
        ]);

        const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.SERVER_E2B_API_KEY });
        const clone_url = repo_url.replace("https://", `https://x-access-token:${token}@`);

        // `--progress` because git only reports progress when stderr is a terminal, and here it
        // never is — without it a ten-minute clone is silent, which is the thing being fixed.
        //
        // Both the stream and the failure path are redacted. `clone_url` carries a live
        // installation token and git echoes the whole URL back in its own fatal messages, which
        // run_worker_loop then writes into worker.contextSummary — so an unredacted clone
        // failure puts a working credential in the database, not just on screen.
        const stream = SandboxStream.plain(log, [token]);
        try {
            await sandbox.commands.run(
                `git clone --progress --depth 1 --branch ${branch} --single-branch ${clone_url} ${REPO_DIR}`,
                {
                    timeoutMs: CLONE_TIMEOUT_MS,
                    onStdout: stream.onStdout,
                    onStderr: stream.onStderr,
                },
            );
        } catch (error) {
            throw new Error(
                redact(error instanceof Error ? error.message : String(error), [token]),
            );
        } finally {
            stream.flush();
        }

        const env_file = Object.entries(secrets)
            .map(([key, value]) => `${key}=${value}`)
            .join("\n");
        await sandbox.files.write(`${REPO_DIR}/.env`, env_file);
    }
}

function validate_branch(branch: string): void {
    if (!SAFE_BRANCH.test(branch)) {
        throw new Error(`refusing to use unsafe branch name: ${branch}`);
    }
}
