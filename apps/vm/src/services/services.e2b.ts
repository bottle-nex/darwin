import { CommandResult, Sandbox, SnapshotInfo } from "e2b";
import { ENV } from "../conf/config.env";
import GithubService from "./service.github";
import SecretService from "./service.secret";
import PlanService from "./services.plan";
import { sign_worker_jwt } from "./service.jwt";
import IssueSolver, { type ClaimedIssue } from "./service.issue_solver";
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

interface AgentReport {
    result?: string;
    total_cost_usd: number;
    duration_ms: number;
    num_turns: number;
}

export default class E2B {
    public static async run_onboarding_job(
        session_id: string,
        project_id: string,
        github_repo_url: string,
        branch: string,
        installation_id: number,
    ) {
        let sandbox_id: string | null = null;
        console.log("github url is : ", github_repo_url);
        console.log("branch is : ", branch);
        try {
            await Promise.all([
                prisma.setupSession.update({
                    where: { id: session_id },
                    data: { status: "Provisioning" },
                }),
                PlanService.mark_generating(project_id),
            ]);

            sandbox_id = await E2B.create();
            await prisma.setupSession.update({
                where: { id: session_id },
                data: { sandboxId: sandbox_id, status: "Cloning" },
            });

            await E2B.clone_repo(sandbox_id, github_repo_url, branch, installation_id, project_id);
            const commit_sha = await E2B.head_commit(sandbox_id);

            await prisma.setupSession.update({
                where: { id: session_id },
                data: { status: "Detecting" },
            });

            const brief = await PlanService.generate_plan(sandbox_id);
            await PlanService.set_plan(project_id, brief.planMd, commit_sha);

            await prisma.setupSession.update({
                where: { id: session_id },
                data: { status: "Ready", finishedAt: new Date() },
            });
        } catch (error) {
            console.error(`[onboarding] session ${session_id} failed:`, error);
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
                console.error(`[onboarding] failed to mark session as Failed:`, e);
            }
        } finally {
            if (sandbox_id) {
                try {
                    await E2B.destroy(sandbox_id);
                } catch (e) {
                    console.error(`[onboarding] failed to tear down sandbox ${sandbox_id}:`, e);
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
        const worker = await prisma.worker.findUniqueOrThrow({
            where: { id: worker_id },
            include: { project: { include: { githubInstallation: true } } },
        });

        const { project } = worker;
        if (!project.githubRepoUrl || !project.githubDefaultBranch || !project.githubInstallation) {
            console.error(
                `[vm:${worker_id}] project ${project.id} is missing repo url / default branch / ` +
                    `github installation — cannot run (writing worker Dead to db)`,
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

        let sandbox_id = worker.sandboxId;
        console.log(`[vm:${worker_id}] starting worker loop for project ${project.id}`);

        try {
            if (!sandbox_id) {
                console.log(`[vm:${worker_id}] no live sandbox — creating one`);
                sandbox_id = await E2B.create(WORKER_SANDBOX_TIMEOUT_MS);
                console.log(`[vm:${worker_id}] sandbox created: ${sandbox_id} (writing to db)`);
                await prisma.worker.update({
                    where: { id: worker_id },
                    data: { sandboxId: sandbox_id },
                });

                console.log(`[vm:${worker_id}] cloning repo into sandbox...`);
                await E2B.clone_repo(sandbox_id, repo_url, branch, installation_id, project.id);
                console.log(`[vm:${worker_id}] clone complete`);
            } else {
                console.log(`[vm:${worker_id}] reusing live sandbox ${sandbox_id}`);
            }

            const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.SERVER_E2B_API_KEY });

            const [gh_token, worker_token] = await Promise.all([
                GithubService.getInstallationToken(installation_id),
                Promise.resolve(sign_worker_jwt(worker_id)),
            ]);
            console.log(`[vm:${worker_id}] minted github + worker tokens for the sandbox`);

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
            console.log(`[vm:${worker_id}] wrote mcp config into sandbox`);

            console.log(`[vm:${worker_id}] marking worker Busy (writing to db)`);
            await prisma.worker.update({
                where: { id: worker_id },
                data: { status: WorkerStatus.Busy },
            });

            const model = ENV.SERVER_SOLVE_MODEL;
            const effort = ENV.SERVER_SOLVE_EFFORT;
            let solved_count = 0;

            for (;;) {
                const issue = await IssueSolver.claim_next_issue(worker_id);
                if (!issue) {
                    console.log(
                        `[vm:${worker_id}] queue empty after ${solved_count} issue(s) — stopping loop`,
                    );
                    break;
                }

                console.log(
                    `[vm:${worker_id}] pushing issue #${issue.number} "${issue.title}" into sandbox`,
                );
                await sandbox.files.write(ISSUE_PROMPT_PATH, E2B.build_issue_prompt(issue, branch));

                console.log(
                    `[vm:${worker_id}] invoking claude for issue #${issue.number} ` +
                        `(model=${model}, effort=${effort})...`,
                );
                const result = await sandbox.commands.run(
                    `claude -p "$(cat ${ISSUE_PROMPT_PATH})" --model ${model} --effort ${effort} ` +
                        `--mcp-config ${MCP_CONFIG_PATH} --output-format json --permission-mode bypassPermissions`,
                    {
                        cwd: REPO_DIR,
                        envs: {
                            ANTHROPIC_API_KEY: ENV.SERVER_ANTHROPIC_API_KEY,
                            GH_TOKEN: gh_token,
                        },
                        timeoutMs: ISSUE_SOLVE_TIMEOUT_MS,
                    },
                );

                let report: AgentReport;
                try {
                    report = JSON.parse(result.stdout);
                } catch {
                    throw new Error(
                        `solving agent did not return JSON for issue #${issue.number}: ${result.stderr}`,
                    );
                }

                console.log(
                    `[vm:${worker_id}] issue #${issue.number} run finished — turns=${report.num_turns} ` +
                        `cost_usd=${report.total_cost_usd} duration_ms=${report.duration_ms}`,
                );
                console.log(
                    `[vm:${worker_id}] final message from claude:\n${report.result ?? "(empty)"}`,
                );
                solved_count++;
            }

            console.log(`[vm:${worker_id}] marking worker Idle (writing to db)`);
            await prisma.worker.update({
                where: { id: worker_id },
                data: { status: WorkerStatus.Idle },
            });
        } catch (error) {
            console.error(`[vm:${worker_id}] worker loop failed:`, error);
            try {
                console.log(`[vm:${worker_id}] marking worker Dead after failure (writing to db)`);
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
            } catch (e) {
                console.error(`[vm:${worker_id}] failed to mark worker Dead:`, e);
            }
        } finally {
            if (sandbox_id) {
                console.log(`[vm:${worker_id}] tearing down sandbox ${sandbox_id}`);
                try {
                    await E2B.destroy(sandbox_id);
                    await prisma.worker.update({
                        where: { id: worker_id },
                        data: { sandboxId: null },
                    });
                    console.log(`[vm:${worker_id}] sandbox destroyed`);
                } catch (e) {
                    console.error(
                        `[vm:${worker_id}] failed to tear down sandbox ${sandbox_id}:`,
                        e,
                    );
                }
            }
        }
    }

    private static build_issue_prompt(issue: ClaimedIssue, base_branch: string): string {
        return `You are an autonomous coding agent working inside a fresh clone of this repository at ${REPO_DIR}, currently on branch "${base_branch}".

## Issue #${issue.number}: ${issue.title}

${issue.description}

## What to do, in this exact order

1. Create a new git branch off "${base_branch}" (never commit directly to "${base_branch}"). Pick a short, descriptive branch name.
2. Implement the fix using your normal tools.
3. Commit your changes with a clear commit message.
4. Push the branch and open a pull request against "${base_branch}" using the gh CLI (already authenticated via GH_TOKEN). Write a clear PR title and description referencing issue #${issue.number}.
5. Call the report_pr_opened MCP tool with issue_id "${issue.id}", the PR URL, the branch name, and a one-sentence summary of the change.

Do all of this yourself with your Bash tool — you have full permissions in this sandbox.`;
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
    ) {
        if (!SAFE_BRANCH.test(branch)) {
            throw new Error(`refusing to clone unsafe branch name: ${branch}`);
        }

        const [token, secrets] = await Promise.all([
            GithubService.getInstallationToken(installation_id),
            SecretService.get_all_secrets(project_id),
        ]);

        const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.SERVER_E2B_API_KEY });
        const clone_url = repo_url.replace("https://", `https://x-access-token:${token}@`);

        await sandbox.commands.run(
            `git clone --depth 1 --branch ${branch} --single-branch ${clone_url} ${REPO_DIR}`,
            { timeoutMs: CLONE_TIMEOUT_MS },
        );

        const env_file = Object.entries(secrets)
            .map(([key, value]) => `${key}=${value}`)
            .join("\n");
        await sandbox.files.write(`${REPO_DIR}/.env`, env_file);
    }
}
