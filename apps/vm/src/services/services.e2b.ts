import { CommandResult, Sandbox, SnapshotInfo } from "e2b";
import { ENV } from "../conf/config.env";
import GithubService from "./service.github";
import SecretService from "./service.secret";
import PlanService from "./services.plan";
import { sign_worker_jwt } from "./service.jwt";
import { prisma, WorkerStatus } from "@trymatcha/database";

const REPO_DIR = "/home/user/repo";
const SAFE_BRANCH = /^[A-Za-z0-9._/-]+$/;
const SANDBOX_TIMEOUT_MS = 15 * 60_000;
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
     * One-off issue-solving run for a single hardcoded issue against `worker_id`.
     * No router/dispatch involved — this exists to prove the sandbox -> Claude Code ->
     * sandbox-mcp -> server loop end to end before that machinery is wired up.
     *
     * Order of operations inside the sandbox (enforced via the prompt, not by us):
     * solve the issue -> report_status("Idle") over MCP -> push branch + open PR ->
     * report_pr_opened() over MCP. We only touch the DB before/after the claude run;
     * the Busy->Idle transition happens from inside the sandbox via sandbox-mcp.
     */
    public static async run_issue_job(
        worker_id: string,
        project_id: string,
        github_repo_url: string,
        branch: string,
        installation_id: number,
        issue_text: string,
    ): Promise<void> {
        let sandbox_id: string | null = null;
        console.log(`[solve:${worker_id}] starting issue run for project ${project_id}`);
        console.log(`[solve:${worker_id}] repo: ${github_repo_url} (base branch: ${branch})`);

        try {
            console.log(`[solve:${worker_id}] creating sandbox...`);
            sandbox_id = await E2B.create();
            console.log(`[solve:${worker_id}] sandbox created: ${sandbox_id} (writing to db)`);
            await prisma.worker.update({
                where: { id: worker_id },
                data: { sandboxId: sandbox_id },
            });

            console.log(`[solve:${worker_id}] cloning repo into sandbox...`);
            await E2B.clone_repo(sandbox_id, github_repo_url, branch, installation_id, project_id);
            console.log(`[solve:${worker_id}] clone complete`);

            const [gh_token, worker_token] = await Promise.all([
                GithubService.getInstallationToken(installation_id),
                Promise.resolve(sign_worker_jwt(worker_id)),
            ]);
            console.log(`[solve:${worker_id}] minted github + worker tokens for the sandbox`);

            const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.SERVER_E2B_API_KEY });

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
            await sandbox.files.write(
                ISSUE_PROMPT_PATH,
                E2B.build_issue_prompt(issue_text, branch),
            );
            console.log(`[solve:${worker_id}] wrote issue prompt + mcp config into sandbox`);

            console.log(`[solve:${worker_id}] marking worker Busy (writing to db)`);
            await prisma.worker.update({
                where: { id: worker_id },
                data: { status: WorkerStatus.Busy },
            });

            const model = ENV.SERVER_SOLVE_MODEL;
            const effort = ENV.SERVER_SOLVE_EFFORT;
            console.log(
                `[solve:${worker_id}] invoking claude (model=${model}, effort=${effort})...`,
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
                throw new Error(`solving agent did not return JSON: ${result.stderr}`);
            }

            console.log(
                `[solve:${worker_id}] claude run finished — turns=${report.num_turns} ` +
                    `cost_usd=${report.total_cost_usd} duration_ms=${report.duration_ms}`,
            );
            console.log(
                `[solve:${worker_id}] final message from claude:\n${report.result ?? "(empty)"}`,
            );
        } catch (error) {
            console.error(`[solve:${worker_id}] run failed:`, error);
            try {
                console.log(
                    `[solve:${worker_id}] marking worker Dead after failure (writing to db)`,
                );
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
                console.error(`[solve:${worker_id}] failed to mark worker Dead:`, e);
            }
        } finally {
            if (sandbox_id) {
                console.log(`[solve:${worker_id}] tearing down sandbox ${sandbox_id}`);
                try {
                    await E2B.destroy(sandbox_id);
                    await prisma.worker.update({
                        where: { id: worker_id },
                        data: { sandboxId: null },
                    });
                    console.log(`[solve:${worker_id}] sandbox destroyed`);
                } catch (e) {
                    console.error(
                        `[solve:${worker_id}] failed to tear down sandbox ${sandbox_id}:`,
                        e,
                    );
                }
            }
        }
    }

    private static build_issue_prompt(issue_text: string, base_branch: string): string {
        return `You are an autonomous coding agent working inside a fresh clone of this repository at ${REPO_DIR}, currently on branch "${base_branch}".

## Issue to solve

${issue_text}

## What to do, in this exact order

1. Create a new git branch off "${base_branch}" (never commit directly to "${base_branch}"). Pick a short, descriptive branch name.
2. Implement the fix using your normal tools.
3. Commit your changes with a clear commit message.
4. This is the only issue queued for you right now — nothing else is coming after it. Before you push or open a pull request, call the report_status MCP tool with status "Idle" to report that you have no more queued work.
5. Push the branch and open a pull request against "${base_branch}" using the gh CLI (already authenticated via GH_TOKEN). Write a clear PR title and description referencing the issue above.
6. Call the report_pr_opened MCP tool with the PR URL, the branch name, and a one-sentence summary of the change.

Do all of this yourself with your Bash tool — you have full permissions in this sandbox.`;
    }

    public static async head_commit(sandbox_id: string): Promise<string> {
        const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.SERVER_E2B_API_KEY });
        const result = await sandbox.commands.run("git rev-parse HEAD", { cwd: REPO_DIR });
        return result.stdout.trim();
    }

    public static async create(): Promise<string> {
        const sandbox = await Sandbox.create("node-py-claude-template", {
            apiKey: ENV.SERVER_E2B_API_KEY,
            timeoutMs: SANDBOX_TIMEOUT_MS,
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
