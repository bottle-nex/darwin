import { CommandResult, Sandbox, SnapshotInfo } from "e2b";
import { ENV } from "../conf/config.env";
import GithubService, { type PullRequestSummary } from "./service.github";
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
import OutcomeReporter from "./service.outcome_queue";
import Logger, { format_duration } from "@trymatcha/logger";
import { prisma, WorkerStatus } from "@trymatcha/database";
import RunReporter from "./service.run_report";
import { randomUUID } from "node:crypto";

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
const PR_BODY_PATH = "/home/user/pr_body.md";
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

    public static async run_worker_loop(worker_id: string): Promise<void> {
        const log = Logger.scope(`vm:${worker_id.slice(-8)}`);
        const worker = await prisma.worker.findUniqueOrThrow({
            where: { id: worker_id },
            include: { project: { include: { githubInstallation: true } } },
        });
        console.log("worker is 1 : ", worker);

        const { project } = worker;
        if (
            !project.githubRepoUrl ||
            !project.githubRepoFullName ||
            !project.githubDefaultBranch ||
            !project.githubInstallation
        ) {
            log.error(
                "project is missing GitHub repository configuration — marking worker Dead",
                undefined,
                { worker: worker_id, project: project.id },
            );
            const worker = await prisma.worker.update({
                where: { id: worker_id },
                data: { status: WorkerStatus.Dead },
            });
            console.log("worker is 2 : ", worker);
            return;
        }

        const repo_url = project.githubRepoUrl;
        const repo_full_name = project.githubRepoFullName;
        const branch = project.githubDefaultBranch;
        const installation_id = Number(project.githubInstallation.installationId);
        const [repo_owner] = repo_full_name.split("/");
        if (!repo_owner) throw new Error("project GitHub repository name is invalid");
        this.validate_branch(branch);

        let sandbox_id = worker.sandboxId;
        let teardown_succeeded = false;
        log.step("worker loop starting", { worker: worker_id, project: project.id, branch });

        try {
            if (!sandbox_id) {
                log.info("no live sandbox — creating one");
                sandbox_id = await E2B.create(WORKER_SANDBOX_TIMEOUT_MS);
                log.info("sandbox created", { sandbox: sandbox_id });
                const worker = await prisma.worker.update({
                    where: { id: worker_id },
                    data: { sandboxId: sandbox_id },
                });
                console.log("worker is 3 : ", worker);

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

            await sandbox.files.write(
                MCP_CONFIG_PATH,
                JSON.stringify(
                    {
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
                    },
                    null,
                    2,
                ),
            );

            log.info("worker marked Busy");
            const worker = await prisma.worker.update({
                where: { id: worker_id },
                data: { status: WorkerStatus.Busy },
            });

            console.log("worker is 4 : ", worker);

            const model = ENV.SERVER_SOLVE_MODEL;
            const effort = ENV.SERVER_SOLVE_EFFORT;
            let solved_count = 0;

            for (;;) {
                const issue = await IssueSolver.claim_next_issue(worker_id, log);
                if (!issue) {
                    log.success("queue empty — stopping loop", { solved: solved_count });
                    break;
                }

                const existing_pull = await E2B.find_pull_request(
                    gh_token,
                    repo_full_name,
                    repo_owner,
                    issue.prBranch,
                    branch,
                );

                console.log("existing_pull", existing_pull);
                const already_pushed = await E2B.prepare_issue_branch(
                    sandbox,
                    issue.prBranch,
                    branch,
                );

                console.log("already_pushed", already_pushed);

                // Minted after the claim lands, and used as the AgentSession id so a
                // retried report is an upsert rather than a second attempt row. A resumed
                // issue whose PR already exists never runs claude, so it has no run.
                let run_id: string | undefined;

                if (existing_pull) {
                    log.info(`existing PR found for issue #${issue.number}`, {
                        pull: existing_pull.number,
                        branch: issue.prBranch,
                    });
                } else if (already_pushed) {
                    log.info(`branch already pushed for issue #${issue.number}`, {
                        branch: issue.prBranch,
                    });
                } else {
                    run_id = randomUUID();
                    await RunReporter.started(worker_token, run_id, issue.id, log);

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
                        await RunReporter.failed(
                            worker_token,
                            run_id,
                            issue.id,
                            error instanceof Error ? error.message : String(error),
                            log,
                        );
                        throw error;
                    }

                    await RunReporter.completed(worker_token, run_id, issue.id, report, log);

                    log.success(`issue #${issue.number} run finished`, {
                        turns: report.num_turns,
                        cost_usd: report.total_cost_usd.toFixed(4),
                        duration: format_duration(report.duration_ms),
                    });
                    log.block("final message from claude", report.result ?? "(empty)");
                }

                const agentDoneIssue = await prisma.issue.update({
                    where: { id: issue.id },
                    data: { agentDoneAt: new Date() },
                });

                console.log("agentDoneIssue", agentDoneIssue);

                let pull_request: PullRequestSummary;
                try {
                    pull_request =
                        existing_pull ??
                        (await E2B.ensure_pull_request(
                            sandbox,
                            gh_token,
                            repo_full_name,
                            repo_owner,
                            issue,
                            branch,
                        ));
                    console.log("pull request : ", pull_request);
                } catch (error) {
                    await OutcomeReporter.publish({
                        kind: "failed",
                        issueId: issue.id,
                        workerId: worker_id,
                        reason: error instanceof Error ? error.message : String(error),
                        runId: run_id,
                    });
                    throw error;
                }

                const issueWithPr = await prisma.issue.update({
                    where: { id: issue.id },
                    data: {
                        prUrl: pull_request.htmlUrl,
                        prNumber: pull_request.number,
                        prTitle: pull_request.title,
                    },
                });

                console.log("issueWithPr", issueWithPr);

                log.info(`PR ready for issue #${issue.number}`, { pull: pull_request.number });
                await OutcomeReporter.publish({
                    kind: "pr_opened",
                    issueId: issue.id,
                    workerId: worker_id,
                    prUrl: pull_request.htmlUrl,
                    branch: issue.prBranch,
                    summary: `Completed issue #${issue.number}: ${issue.title}`,
                    runId: run_id,
                });
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
            if (sandbox_id) {
                log.info("tearing down sandbox", { sandbox: sandbox_id });
                try {
                    await E2B.destroy(sandbox_id);
                    teardown_succeeded = true;
                    log.info("sandbox destroyed");
                } catch (e) {
                    log.error("sandbox teardown failed", e, { sandbox: sandbox_id });
                }

                if (teardown_succeeded) {
                    try {
                        await prisma.worker.update({
                            where: { id: worker_id },
                            data: { sandboxId: null },
                        });
                    } catch (e) {
                        log.error("could not clear destroyed sandbox", e, { sandbox: sandbox_id });
                    }
                }
            } else {
                teardown_succeeded = true;
            }
        }
    }

    private static build_issue_prompt(
        issue: ClaimedIssue,
        base_branch: string,
        plan_md: string | null,
    ): string {
        const intro = `You are an autonomous coding agent working inside a fresh clone of this repository at ${REPO_DIR}, currently on branch "${issue.prBranch}".`;

        const brief = plan_md
            ? `## Project brief

An earlier agent explored this repository and wrote the brief below. Lean on it to orient yourself instead of rediscovering the layout from scratch. It was written against an earlier commit, so confirm anything you depend on before acting on it.

${plan_md}`
            : null;

        const issue_section = `## Issue #${issue.number}: ${issue.title}

${issue.description}`;

        const actions = [
            `Investigate the issue and read every relevant file before changing it.`,
            `Stay on the existing branch "${issue.prBranch}". Never switch branches or commit directly to "${base_branch}".`,
            `Implement the fix using your normal tools.`,
            `Commit your changes with a clear commit message.`,
            `Push the branch to origin. Do not open a pull request — that is handled for you once you finish.`,
            `Write a short markdown summary of your change to ${PR_BODY_PATH}. It becomes the pull request description.`,
        ];

        const steps = `## What to do, in this exact order

${actions.map((action, index) => `${index + 1}. ${action}`).join("\n")}

Do all of this yourself with your Bash tool — you have full permissions in this sandbox.

Never start a long-running command in the background and end your turn waiting on it. This is a single non-interactive run: there is no later turn to come back to, so anything left running when you stop is lost and the issue goes unsolved. Run it in the foreground and wait for it to finish.`;

        return [intro, brief, issue_section, steps].filter(Boolean).join("\n\n");
    }

    private static async prepare_issue_branch(
        sandbox: Sandbox,
        issue_branch: string,
        base_branch: string,
    ): Promise<boolean> {
        this.validate_branch(issue_branch);
        this.validate_branch(base_branch);

        const remote_branch = await sandbox.commands.run(
            `git ls-remote --heads origin refs/heads/${issue_branch}`,
            { cwd: REPO_DIR },
        );
        const already_pushed = Boolean(remote_branch.stdout.trim());

        const current_branch = await sandbox.commands.run("git branch --show-current", {
            cwd: REPO_DIR,
        });
        if (current_branch.stdout.trim() !== issue_branch) {
            const source_branch = already_pushed ? issue_branch : base_branch;
            await sandbox.commands.run(`git fetch --depth 1 origin ${source_branch}`, {
                cwd: REPO_DIR,
            });
            await sandbox.commands.run(`git switch --force-create ${issue_branch} FETCH_HEAD`, {
                cwd: REPO_DIR,
            });
        }

        return already_pushed;
    }

    private static async find_pull_request(
        token: string,
        repo_full_name: string,
        repo_owner: string,
        issue_branch: string,
        base_branch: string,
    ): Promise<PullRequestSummary | null> {
        const pulls = await GithubService.listOpenPullRequests(
            token,
            repo_full_name,
            repo_owner,
            issue_branch,
            base_branch,
        );
        if (pulls.length > 1) {
            throw new Error(`multiple open PRs found for branch ${issue_branch}`);
        }
        return pulls[0] ?? null;
    }

    private static async ensure_pull_request(
        sandbox: Sandbox,
        token: string,
        repo_full_name: string,
        repo_owner: string,
        issue: ClaimedIssue,
        base_branch: string,
    ): Promise<PullRequestSummary> {
        const summary = await sandbox.files.read(PR_BODY_PATH).catch(() => "");
        try {
            return await GithubService.createPullRequest(token, repo_full_name, {
                head: issue.prBranch,
                base: base_branch,
                title: `${issue.title} (#${issue.number})`,
                body: summary.trim() || `Resolves issue #${issue.number}: ${issue.title}`,
            });
        } catch (error) {
            const existing = await E2B.find_pull_request(
                token,
                repo_full_name,
                repo_owner,
                issue.prBranch,
                base_branch,
            );
            if (existing) return existing;
            throw error;
        }
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
        this.validate_branch(branch);

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

    public static validate_branch(branch: string): void {
        if (!SAFE_BRANCH.test(branch)) {
            throw new Error(`refusing to use unsafe branch name: ${branch}`);
        }
    }
}
