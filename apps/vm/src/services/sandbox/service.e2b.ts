import { randomUUID } from "node:crypto";

import { ExecutionMode, Harness, Prisma, prisma, WorkerStatus } from "@trydarwin/database";
import { type McpServerSpec, Registry } from "@trydarwin/harness";
import Logger, { format_duration } from "@trydarwin/logger";
import { RunLogEventKind, type RunLogMilestoneBody, RunLogPhase } from "@trydarwin/types";
import type { CommandResult, SnapshotInfo } from "e2b";
import { Sandbox } from "e2b";

import { ENV } from "../../conf/config.env";
import {
    has_node_project,
    install_dependencies,
    pick_package_manager,
} from "../capsule/service.workspace";
import GraphService, {
    GRAPHIFY_INTEGRATION,
    GRAPHIFY_OUT,
    GRAPHIFY_SETTINGS,
} from "../context/service.graph";
import PlanService from "../context/service.plan";
import IssueSolver, { type ClaimedIssue } from "../dispatch/service.issue_solver";
import OutcomeReporter from "../dispatch/service.outcome_queue";
import { resolve_harness_env } from "../harness/service.credentials";
import HarnessRun from "../harness/service.run";
import GithubService, { type PullRequestSummary } from "../platform/service.github";
import { sign_worker_jwt } from "../platform/service.jwt";
import SecretService from "../platform/service.secret";
import RunLogRegistry from "../run_log/service.registry";
import RunReporter from "../run_log/service.report";
import RunLogWriter from "../run_log/service.writer";
import SandboxStream, { describe_failure, failure_sentence } from "./service.stream";

const REPO_DIR = "/home/user/repo";
const SAFE_BRANCH = /^[A-Za-z0-9._/-]+$/;
// Held while a run drives this worker and renewed as it goes, so a paused run keeps its claim
// while a crashed process lets it lapse.
const WORKER_LEASE_MS = 5 * 60_000;
const WORKER_LEASE_RENEW_MS = 60_000;
const SANDBOX_TIMEOUT_MS = 15 * 60_000;
// E2B rejects sandbox creation above 1 hour outright ("Timeout cannot be greater than 1
// hours") — this is a hard platform cap, not a tunable. A worker loop that legitimately
// needs longer than this to get through its queued issues will have its sandbox killed
// mid-run; there's no keep-alive/extend wired up yet, so a long-running loop is a known
// gap, not something this constant can paper over.
const WORKER_SANDBOX_TIMEOUT_MS = 55 * 60_000;
const CLONE_TIMEOUT_MS = 10 * 60_000;
const ISSUE_PROMPT_PATH = "/home/user/issue_prompt.txt";

type ChangesSummary = Extract<RunLogMilestoneBody, { kind: typeof RunLogEventKind.ChangesSummary }>;
type Committed = Extract<RunLogMilestoneBody, { kind: typeof RunLogEventKind.Committed }>;

// A unit separator between a commit's fields and a record separator between commits, because a
// commit message contains newlines and anything friendlier would be ambiguous.
const COMMIT_FORMAT = "%H%x1f%s%x1f%b%x1e";
const PR_BODY_PATH = "/home/user/pr_body.md";
const SOLVE_REPORT_PATH = "/home/user/solve_report.md";
const SOLVE_REPORT_MAX_CHARS = 16_000;
const SANDBOX_MCP_ENTRY = "/opt/darwin/sandbox-mcp/index.js";
const ISSUE_SOLVE_TIMEOUT_MS = 30 * 60_000;
const ISSUE_PUSH_TIMEOUT_MS = 10 * 60_000;
const MAX_PUSH_ATTEMPTS = 3;

export function requires_agent_run(agent_done_at: Date | null, resuming_push: boolean): boolean {
    return agent_done_at === null && !resuming_push;
}

const BASE_MCP_SERVER: McpServerSpec = {
    name: "darwin",
    command: "node",
    args: [SANDBOX_MCP_ENTRY],
    env: {
        DARWIN_SERVER_URL: ENV.PUBLIC_API_URL,
        DARWIN_SESSION_KIND: "worker",
    },
};

interface SolveContext {
    sandbox: Sandbox;
    log: Logger;
    workerId: string;
    projectId: string;
    planMd: string | null;
    repoFullName: string;
    repoOwner: string;
    baseBranch: string;
    ghToken: string;
    secrets: () => string[];
    pushRetryIssueId: string | undefined;
}

class IssueBranchPushError extends Error {}

function previous_push_attempts(worker: { contextSummary: unknown }): number {
    const summary = worker.contextSummary as { pushAttempts?: unknown } | null;
    const attempts = Number(summary?.pushAttempts);
    return Number.isInteger(attempts) && attempts > 0 ? attempts : 0;
}

/**
 * The issue whose commit is sitting unpushed in this worker's retained sandbox.
 *
 * A push retry must not reset the branch or re-run the agent: the work only exists locally,
 * so resetting destroys it and re-running spends a whole run rediscovering a fix that is
 * already committed one line above.
 */
function pending_push_issue_id(worker: { contextSummary: unknown }): string | undefined {
    if (previous_push_attempts(worker) === 0) return undefined;
    const summary = worker.contextSummary as { issueId?: unknown } | null;
    return typeof summary?.issueId === "string" ? summary.issueId : undefined;
}

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
            const failure = describe_failure("onboard project", error, []);
            log.error("onboarding failed", error, {
                session: session_id,
                project: project_id,
                sandbox: sandbox_id,
                stage: failure.stage,
            });
            try {
                await Promise.all([
                    prisma.setupSession.update({
                        where: { id: session_id },
                        data: {
                            status: "Failed",
                            error: failure_sentence(failure),
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
     * Claims the right to drive this worker, so two jobs for the same worker cannot run at once.
     *
     * The queue is configured never to redeliver a dispatch job, but a duplicate enqueue would
     * still land here, and two loops sharing one sandbox re-run the issue the first is paused on.
     * The lease is renewed while the loop runs and cleared when it ends, so a process that dies
     * mid-run releases it by letting the lease lapse rather than stranding the worker forever.
     */
    private static async claim_lease(worker_id: string): Promise<boolean> {
        const now = new Date();
        const claimed = await prisma.worker.updateMany({
            where: {
                id: worker_id,
                OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lt: now } }],
            },
            data: { leaseExpiresAt: new Date(now.getTime() + WORKER_LEASE_MS) },
        });

        return claimed.count === 1;
    }

    public static async run_worker_loop(worker_id: string): Promise<void> {
        const log = Logger.scope(`vm:${worker_id.slice(-8)}`);

        if (!(await E2B.claim_lease(worker_id))) {
            log.warn("another run already holds this worker — ignoring the duplicate job", {
                worker: worker_id,
            });
            return;
        }

        const renew_lease = setInterval(() => {
            void prisma.worker
                .update({
                    where: { id: worker_id },
                    data: { leaseExpiresAt: new Date(Date.now() + WORKER_LEASE_MS) },
                })
                .catch(() => undefined);
        }, WORKER_LEASE_RENEW_MS);
        renew_lease.unref();

        try {
            await E2B.drive_worker(worker_id, log);
        } finally {
            clearInterval(renew_lease);
            await prisma.worker
                .update({ where: { id: worker_id }, data: { leaseExpiresAt: null } })
                .catch(() => undefined);
        }
    }

    private static async drive_worker(worker_id: string, log: Logger): Promise<void> {
        const worker = await prisma.worker.findUniqueOrThrow({
            where: { id: worker_id },
            include: { project: { include: { githubInstallation: true } } },
        });

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
            await prisma.worker.update({
                where: { id: worker_id },
                data: { status: WorkerStatus.Dead },
            });
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
        let retain_sandbox = false;
        let gh_token = "";
        let current_issue: ClaimedIssue | null = null;
        let current_run_id: string | undefined;
        const push_retry_issue_id = pending_push_issue_id(worker);

        const secrets = () => [gh_token, ENV.VM_CLAUDE_CODE_OAUTH_TOKEN];
        const failure_fields = () => ({
            worker: worker_id,
            project: project.id,
            sandbox: sandbox_id ?? "none",
            issue: current_issue?.id ?? "none",
            number: current_issue ? `#${current_issue.number}` : "none",
            branch: current_issue?.prBranch ?? "none",
        });

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

            const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.VM_E2B_API_KEY });

            gh_token = await GithubService.getInstallationToken(installation_id);
            log.info("minted github token for the sandbox");

            await E2B.refresh_origin(sandbox, repo_url, gh_token);

            log.info("worker marked Busy");
            await prisma.worker.update({
                where: { id: worker_id },
                data: { status: WorkerStatus.Busy },
            });

            const context: SolveContext = {
                sandbox,
                log,
                workerId: worker_id,
                projectId: project.id,
                planMd: project.planMd,
                repoFullName: repo_full_name,
                repoOwner: repo_owner,
                baseBranch: branch,
                ghToken: gh_token,
                secrets,
                pushRetryIssueId: push_retry_issue_id,
            };

            let solved_count = 0;

            for (;;) {
                const issue = await IssueSolver.claim_next_issue(worker_id, log);
                current_issue = issue;
                if (!issue) {
                    log.success("queue empty — stopping loop", { solved: solved_count });
                    break;
                }

                await E2B.solve_one_issue(context, issue, (run_id) => {
                    current_run_id = run_id;
                });
                solved_count++;
            }

            log.info("worker marked Idle");
            await prisma.worker.update({
                where: { id: worker_id },
                data: { status: WorkerStatus.Idle, contextSummary: Prisma.DbNull },
            });
        } catch (error) {
            const failure = describe_failure(
                current_issue ? "run issue" : "start worker loop",
                error,
                secrets(),
            );
            const push_attempts =
                error instanceof IssueBranchPushError ? previous_push_attempts(worker) + 1 : 0;
            retain_sandbox =
                error instanceof IssueBranchPushError && push_attempts < MAX_PUSH_ATTEMPTS;

            log.error("worker loop failed", new Error(failure.message), {
                ...failure_fields(),
                stage: failure.stage,
                ...(push_attempts > 0 && { attempt: `${push_attempts}/${MAX_PUSH_ATTEMPTS}` }),
            });

            try {
                await prisma.worker.update({
                    where: { id: worker_id },
                    data: {
                        status: retain_sandbox ? WorkerStatus.Idle : WorkerStatus.Dead,
                        contextSummary: {
                            stage: failure.stage,
                            error: failure.message,
                            issueId: current_issue?.id ?? null,
                            issueNumber: current_issue?.number ?? null,
                            branch: current_issue?.prBranch ?? null,
                            failedAt: new Date().toISOString(),
                            pushAttempts: push_attempts,
                            retryable: retain_sandbox,
                        },
                    },
                });
                log.warn(
                    retain_sandbox
                        ? "worker retained for branch push retry"
                        : "worker marked Dead after failure",
                    failure_fields(),
                );
            } catch (e) {
                log.error("could not mark worker Dead", e, failure_fields());
            }
            if (!retain_sandbox && current_issue && error instanceof IssueBranchPushError) {
                log.error(
                    `giving up on issue #${current_issue.number} after ${push_attempts} push attempts`,
                    new Error(failure.message),
                    failure_fields(),
                );
                await OutcomeReporter.publish({
                    kind: "failed",
                    issueId: current_issue.id,
                    workerId: worker_id,
                    reason: failure_sentence(failure),
                    runId: current_run_id,
                }).catch((e) =>
                    log.error("could not report the failed issue", e, failure_fields()),
                );
            }
        } finally {
            if (sandbox_id && !retain_sandbox) {
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
            } else if (!sandbox_id) {
                teardown_succeeded = true;
            } else {
                log.info("retaining sandbox for branch push retry", { sandbox: sandbox_id });
            }
        }
    }

    private static async solve_one_issue(
        context: SolveContext,
        issue: ClaimedIssue,
        on_run_started: (run_id: string) => void,
    ): Promise<void> {
        const { sandbox, log, secrets } = context;

        const existing_pull = await E2B.find_pull_request(
            context.ghToken,
            context.repoFullName,
            context.repoOwner,
            issue.prBranch,
            context.baseBranch,
        );

        const resuming_push = context.pushRetryIssueId === issue.id;
        const already_pushed = await E2B.prepare_issue_branch(
            sandbox,
            issue.prBranch,
            context.baseBranch,
            resuming_push,
        );

        const base_commit = await E2B.head_of(sandbox);
        const ran_agent = requires_agent_run(issue.agentDoneAt, resuming_push);

        let run_id: string | undefined;
        let run_worker_token: string | undefined;

        let run_writer: RunLogWriter | null = null;
        const milestone = (phase: RunLogPhase, event: RunLogMilestoneBody) => {
            void run_writer
                ?.write_observed(phase, event)
                .catch((error: unknown) =>
                    log.warn("run log milestone not stored", { error: String(error) }),
                );
        };

        if (!ran_agent) {
            log.info(`no agent work owed for issue #${issue.number}`, {
                branch: issue.prBranch,
                pull: existing_pull?.number ?? "none",
                pushed: already_pushed,
                retryingPush: resuming_push,
            });
        } else {
            const { harness, model, effort } = issue;
            const agent = Registry.get(harness);

            run_id = randomUUID();
            on_run_started(run_id);
            run_worker_token = sign_worker_jwt(context.workerId);
            const version_result = await sandbox.commands
                .run(`${agent.binary} --version`)
                .catch(() => null);
            const harness_version = version_result?.stdout?.trim() || undefined;

            await RunReporter.started(
                run_worker_token,
                { run_id, issue_id: issue.id, harness, model, effort, harness_version },
                log,
            );

            // graphify installs first — for OpenCode its own installer writes into
            // the same file our MCP config lives in (.opencode/opencode.json), so our
            // write has to go last and has to merge rather than overwrite, or one of
            // the two configs silently disappears depending on write order.
            const is_claude = harness === Harness.Claude;
            const graph_state = await GraphService.prepare(sandbox, log, harness);

            const mcp_config_path = agent.mcpConfigPath();
            const existing_mcp_config = await sandbox.files.read(mcp_config_path).catch(() => null);
            /**
             * The run's identity and log endpoint belong on the MCP server's own env,
             * not the harness process's: the agent spawns this server as a child with a
             * restricted environment plus whatever this block names, so anything set
             * only on the harness never reaches the tool that has to report.
             */
            const run_mcp_server: McpServerSpec = {
                ...BASE_MCP_SERVER,
                env: {
                    ...BASE_MCP_SERVER.env,
                    DARWIN_SANDBOX_TOKEN: run_worker_token,
                    DARWIN_RUN_ID: run_id,
                    ...(ENV.VM_PUBLIC_URL ? { DARWIN_VM_URL: ENV.VM_PUBLIC_URL } : {}),
                },
            };
            await sandbox.files.write(
                mcp_config_path,
                agent.buildMcpConfig(run_mcp_server, existing_mcp_config),
            );

            log.step(`issue #${issue.number} pushed into sandbox`, { title: issue.title });
            await sandbox.files.write(
                ISSUE_PROMPT_PATH,
                E2B.build_issue_prompt(
                    issue,
                    context.baseBranch,
                    context.planMd,
                    await E2B.dependencies_installed(sandbox),
                ),
            );

            log.info(`invoking ${harness} for issue #${issue.number}`, {
                model,
                effort,
                attempt: issue.attemptNumber,
                brief: context.planMd ? "included" : "absent",
            });

            const writer = RunLogWriter.open(
                run_id,
                { projectId: context.projectId, issueId: issue.id },
                secrets(),
                log,
            );
            RunLogRegistry.register(run_id, writer, run_worker_token);
            run_writer = writer;

            let report;
            try {
                report = await HarnessRun.execute(sandbox, log, {
                    harness,
                    prompt_path: ISSUE_PROMPT_PATH,
                    model,
                    effort,
                    extra_flags: [
                        ...agent.mcpConfigFlags(mcp_config_path),
                        ...(is_claude && graph_state === "ready"
                            ? [
                                  `--settings ${GRAPHIFY_SETTINGS}`,
                                  `--add-dir ${GRAPHIFY_INTEGRATION}`,
                              ]
                            : []),
                    ],
                    envs: {
                        ...(await resolve_harness_env(harness, context.projectId)),
                        GH_TOKEN: context.ghToken,
                        ...(graph_state === "ready" ? { GRAPHIFY_OUT } : {}),
                    },
                    timeout_ms: ISSUE_SOLVE_TIMEOUT_MS,
                    label: `solving agent for issue #${issue.number}`,
                    ...(issue.executionMode === ExecutionMode.Manual
                        ? {
                              pause_on_question: {
                                  session_id: run_id,
                                  sandbox_id: sandbox.sandboxId,
                                  resume_timeout_ms: WORKER_SANDBOX_TIMEOUT_MS,
                              },
                          }
                        : {}),
                    // Fire-and-forget: the trace arrives as the harness streams it, and
                    // holding that stream to await a cache write would slow the run down
                    // to the speed of its own logging.
                    on_observed: (event) => {
                        void writer
                            .write_observed(RunLogPhase.Agent, event)
                            .catch((error: unknown) =>
                                log.warn("observed run log event not stored", {
                                    error: String(error),
                                }),
                            );
                    },
                });
            } catch (error) {
                milestone(RunLogPhase.Agent, {
                    kind: RunLogEventKind.RunFailed,
                    reason: failure_sentence(describe_failure("solve issue", error, secrets())),
                });
                RunLogRegistry.release(run_id);
                await RunReporter.failed(
                    run_worker_token,
                    run_id,
                    issue.id,
                    failure_sentence(describe_failure("solve issue", error, secrets())),
                    log,
                );
                throw error;
            }

            milestone(RunLogPhase.Agent, {
                kind: RunLogEventKind.AgentFinished,
                durationMs: report.duration_ms,
            });

            for (const commit of await E2B.commits_since(sandbox, base_commit)) {
                milestone(RunLogPhase.Publish, commit);
            }

            const changes = await E2B.changes_since(sandbox, base_commit);
            if (changes) milestone(RunLogPhase.Publish, changes);

            RunLogRegistry.release(run_id);
            await RunReporter.completed(
                run_worker_token,
                run_id,
                issue.id,
                report,
                changes?.files,
                await E2B.read_solve_report(sandbox),
                log,
            );

            log.success(`issue #${issue.number} run finished`, {
                turns: report.num_turns ?? "unknown",
                cost_usd: (report.total_cost_usd ?? 0).toFixed(4),
                duration: format_duration(report.duration_ms),
            });
            log.block(`final message from ${harness}`, report.result ?? "(empty)");
        }

        const has_unpushed_work = ran_agent || resuming_push || (!existing_pull && !already_pushed);
        if (has_unpushed_work) {
            await E2B.push_issue_branch(sandbox, issue.prBranch, secrets());

            if (issue.executionMode === ExecutionMode.Manual && run_worker_token) {
                await RunReporter.notify(
                    run_worker_token,
                    issue.id,
                    `Issue #${issue.number} "${issue.title}" is pushed to ${issue.prBranch}.`,
                    log,
                );
            }
        }

        if (issue.agentDoneAt === null) {
            await prisma.issue.update({
                where: { id: issue.id },
                data: { agentDoneAt: new Date() },
            });
        }

        // Manual mode stops here. The branch is pushed and the decision is a person's, so the
        // worker hands it over and takes the next issue rather than holding this sandbox open
        // until somebody answers.
        if (
            issue.executionMode === ExecutionMode.Manual &&
            !existing_pull &&
            run_worker_token &&
            run_id
        ) {
            await RunReporter.request_pr_approval(
                run_worker_token,
                issue.id,
                run_id,
                await sandbox.files.read(PR_BODY_PATH).catch(() => ""),
                log,
            );

            log.info(`issue #${issue.number} awaiting pull request approval`);
            return;
        }

        let pull_request: PullRequestSummary;
        try {
            pull_request =
                existing_pull ??
                (await E2B.ensure_pull_request(
                    sandbox,
                    context.ghToken,
                    context.repoFullName,
                    context.repoOwner,
                    issue,
                    context.baseBranch,
                ));
        } catch (error) {
            await OutcomeReporter.publish({
                kind: "failed",
                issueId: issue.id,
                workerId: context.workerId,
                reason: failure_sentence(describe_failure("open pull request", error, secrets())),
                runId: run_id,
            });
            throw error;
        }

        await prisma.issue.update({
            where: { id: issue.id },
            data: {
                prUrl: pull_request.htmlUrl,
                prNumber: pull_request.number,
                prTitle: pull_request.title,
            },
        });

        milestone(RunLogPhase.Publish, {
            kind: RunLogEventKind.PullRequestOpened,
            number: pull_request.number,
            url: pull_request.htmlUrl,
        });

        log.info(`PR ready for issue #${issue.number}`, { pull: pull_request.number });
        await OutcomeReporter.publish({
            kind: "pr_opened",
            issueId: issue.id,
            workerId: context.workerId,
            prUrl: pull_request.htmlUrl,
            branch: issue.prBranch,
            summary: `Completed issue #${issue.number}: ${issue.title}`,
            runId: run_id,
        });
    }

    /**
     * Checked here rather than remembered from the clone, because a reused sandbox never runs the
     * clone again and a repository we could not install must not be told that it was.
     */
    private static async dependencies_installed(sandbox: Sandbox): Promise<boolean> {
        const result = await sandbox.commands
            .run(`test -d ${REPO_DIR}/node_modules`, { cwd: REPO_DIR })
            .catch(() => null);
        return result !== null;
    }

    private static build_issue_prompt(
        issue: ClaimedIssue,
        base_branch: string,
        plan_md: string | null,
        dependencies_installed: boolean,
    ): string {
        const reopened = issue.reopenNote !== null;

        const intro = reopened
            ? `You are an autonomous coding agent working inside a clone of this repository at ${REPO_DIR}, on branch "${issue.prBranch}". This issue has been worked ${issue.attemptNumber - 1} time${issue.attemptNumber === 2 ? "" : "s"} already and its pull request is open. Someone read that work, found it wanting, and sent the issue back for another pass. Read the commits already on this branch before you change anything.`
            : `You are an autonomous coding agent working inside a fresh clone of this repository at ${REPO_DIR}, currently on branch "${issue.prBranch}".`;

        const brief = plan_md
            ? `## Project brief

            An earlier agent explored this repository and wrote the brief below. Lean on it to orient yourself instead of rediscovering the layout from scratch. It was written against an earlier commit, so confirm anything you depend on before acting on it.

            ${plan_md}`
            : null;

        const issue_section = `## Issue #${issue.number}: ${issue.title}

            ${issue.description}`;

        const history = issue.priorAttempts.length
            ? `## What earlier attempts did

            Each report below is a previous attempt's own account of this issue. Read the "Ruled out" sections before you start: they name the dead ends already walked, and repeating one spends the whole run learning what is written down here.

            ${issue.priorAttempts.map((attempt) => `### Attempt ${attempt.attemptNumber}\n\n${attempt.report}`).join("\n\n")}`
            : null;

        const follow_up = issue.reopenNote
            ? `## What to do now

            This is what the person who sent the issue back asked for. It is the job for this run — not the issue description, which describes work that is already committed on this branch.

            ${issue.reopenNote}

            Build on the commits already here. Do not start the issue over, and do not revert or rewrite earlier commits — the pull request keeps its whole history, and a reviewer is reading it.`
            : null;

        const actions = [
            reopened
                ? `Do what "What to do now" asks. Read the files it concerns, and the commits already on this branch, before changing anything.`
                : `Investigate the issue and read every relevant file before changing it.`,
            `Stay on the existing branch "${issue.prBranch}". Never switch branches or commit directly to "${base_branch}".`,
            `Implement the fix using your normal tools.`,
            ...(dependencies_installed
                ? [
                      `Run this repository's own lint and type-check scripts and fix what your change broke. They are the same checks its pre-push hook runs, and the push is rejected if they fail.`,
                  ]
                : []),
            `Commit your changes with a clear commit message.`,
            `Do not push the branch or open a pull request — that is handled for you once you finish.`,
            ...(issue.executionMode === ExecutionMode.Manual
                ? [
                      `This issue is being solved in manual mode. Where the issue is ambiguous about what the result should be, call the ask_user tool and wait for the answer instead of choosing for yourself.`,
                  ]
                : []),
            `Write a short markdown summary of your change to ${PR_BODY_PATH}. It becomes the pull request description.`,
            `Write your solve report to ${SOLVE_REPORT_PATH}, following the template below exactly.`,
        ];

        const manual_section =
            issue.executionMode === ExecutionMode.Manual
                ? `## Asking before you decide

            This issue is in manual mode: a person is standing by to answer you.

            Call the ask_user tool when the issue does not settle what the result should be — which of two reasonable behaviours is wanted, what a value should be, whether a case you found is in scope. Ask with a concrete question and options where there are options; it blocks until they answer, and if nobody answers in time you are told to use your own judgement.

            Ask about the outcome, never about permission to work. Reading files, editing them, running commands and committing are all yours to do without asking. A question about whether you may use a tool wastes the person's time; a question about what the fix should actually do is the reason they are there.

            Ask once for each decision and carry the answer forward. If you can settle it from the codebase, settle it and say so in your report rather than asking.`
                : null;

        const report = `## Your solve report

            ${SOLVE_REPORT_PATH} is the only place your reasoning survives. The person reading it later sees the files you changed and every command you ran, but never why — so write down what they cannot reconstruct.

            Use these five headings, exactly as written, in this order, and nothing else:

            ## The cause
            What was actually wrong. Two sentences at most.

            ## Where
            The files you touched, with line numbers.

            ## The fix, and why this one
            What you changed, and the other approach you considered and rejected. Say why you rejected it.

            ## Ruled out
            The dead ends. Files you read and left alone, causes you suspected and disproved, approaches that would not work in this codebase. This is the most valuable section: it is what stops the next person repeating your work. If you truly ruled nothing out, say so.

            ## How it was checked
            The commands you ran to verify the fix and what they returned. If you did not verify it, write "Not verified" and say what would need running. Never imply you checked something you did not.

            Every claim you make must name a real file, command, or commit from this run. A reader can compare your report against what you actually did, so a file you never opened or a command you never ran makes the whole report untrustworthy.

            This is not the pull request description. ${PR_BODY_PATH} tells a reviewer what changed; this tells a maintainer how you got there. Write both.`;

        const steps = `## What to do, in this exact order

            ${actions.map((action, index) => `${index + 1}. ${action}`).join("\n")}

            Do all of this yourself with your Bash tool — you have full permissions in this sandbox.

            ${
                dependencies_installed
                    ? "This repository's dependencies are already installed, so its own scripts will run."
                    : "This repository's dependencies are not installed, and installing them here is not possible. Verify your change by reading the code rather than by running the project's tooling, and say plainly in your report that you could not run it."
            }

            Never run a package install of your own, whatever the reason. A partial install leaves some packages without their dependencies while still arming the repository's git hooks, and every push after that is rejected. If a tool you want is missing, say so in your report instead.

            ## Reporting your progress

            Someone is watching this run and sees only what you report. Call report_progress immediately after each action you take — every file you read, every file you edit or create, every search, and every command you run. Report the action, not its contents: the file changes and command output are shown separately, so send the path or the command and nothing more. An action you do not report did not happen as far as the person watching is concerned.

            When you report a command, give it a title: a short plain sentence naming what you were trying to achieve, never what you typed — "Retry GitHub API for profile", not "run curl". Send the command and the output you got back with it. The person watching sees only that title until they open it, so a title that just repeats the command tells them nothing.

            Use kind "notice" to record a decision the reader could not guess: a file you deliberately left alone and why, something you ruled out, a constraint you found in their code. Not a running commentary — a note is for a conclusion that would otherwise be invisible to someone who only sees the files you changed.

            Before you turn to a new part of the work, report it with kind "step" and say the goal in one short plain sentence — "Finding where the navbar tiles are defined", not "Calling Grep". The person reading never sees your reasoning, so a step is the only place they learn what you are trying to do, and it is what makes the actions underneath it make sense. Expect roughly five to ten steps across this whole run: a step marks a change of intent, never a single file or command.

            Never start a long-running command in the background and end your turn waiting on it. This is a single non-interactive run: there is no later turn to come back to, so anything left running when you stop is lost and the issue goes unsolved. Run it in the foreground and wait for it to finish.`;

        return [intro, brief, issue_section, history, follow_up, steps, manual_section, report]
            .filter(Boolean)
            .join("\n\n");
    }

    private static async prepare_issue_branch(
        sandbox: Sandbox,
        issue_branch: string,
        base_branch: string,
        keep_local_work: boolean,
    ): Promise<boolean> {
        this.validate_branch(issue_branch);
        this.validate_branch(base_branch);

        const remote_branch = await sandbox.commands.run(
            `git ls-remote --heads origin refs/heads/${issue_branch}`,
            { cwd: REPO_DIR },
        );
        const already_pushed = Boolean(remote_branch.stdout.trim());

        // A push retry is the one case where the sandbox holds work worth keeping: the commit
        // exists only here, so resetting would destroy the very thing we came back to push.
        if (keep_local_work) return already_pushed;

        // Otherwise reset unconditionally, even when the branch is already checked out. A
        // retained sandbox comes back sitting on this branch with the last attempt's commit still
        // on it, and skipping the reset hands the next agent that work — which it then correctly
        // reports as "already done", burning a whole run.
        const source_branch = already_pushed ? issue_branch : base_branch;
        await sandbox.commands.run(`git fetch --depth 1 origin ${source_branch}`, {
            cwd: REPO_DIR,
        });
        await sandbox.commands.run(`git switch --force-create ${issue_branch} FETCH_HEAD`, {
            cwd: REPO_DIR,
        });
        await sandbox.commands.run("git reset --hard FETCH_HEAD", { cwd: REPO_DIR });

        return already_pushed;
    }

    /**
     * Only ever called on a run where the agent actually worked. A resumed issue skips the
     * agent entirely, and reporting an empty section for it would blank the account an
     * earlier run already wrote.
     */
    private static async read_solve_report(sandbox: Sandbox): Promise<string | undefined> {
        const text = (await sandbox.files.read(SOLVE_REPORT_PATH).catch(() => "")).trim();
        return text ? text.slice(0, SOLVE_REPORT_MAX_CHARS) : undefined;
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

    public static async push_issue_branch(
        sandbox: Sandbox,
        issue_branch: string,
        secrets: string[],
    ): Promise<void> {
        this.validate_branch(issue_branch);
        try {
            await sandbox.commands.run(`git push origin ${issue_branch}`, {
                cwd: REPO_DIR,
                timeoutMs: ISSUE_PUSH_TIMEOUT_MS,
            });
        } catch (error) {
            const failure = describe_failure("push issue branch", error, secrets);
            throw new IssueBranchPushError(
                `could not push branch ${issue_branch} — ${failure.message}`,
            );
        }
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

    public static async head_of(sandbox: Sandbox): Promise<string> {
        const result = await sandbox.commands
            .run("git rev-parse HEAD", { cwd: REPO_DIR })
            .catch(() => null);
        return result?.stdout.trim() ?? "";
    }

    /**
     * What the run changed, measured from the commit it started on.
     *
     * The agent commits its own work, so this is read after it finishes rather than tracked as
     * it goes — and it is read against a remembered commit rather than the base branch, which a
     * shallow clone does not have locally to compare with.
     */
    public static async changes_since(
        sandbox: Sandbox,
        base_commit: string,
    ): Promise<ChangesSummary | null> {
        if (!base_commit) return null;
        const result = await sandbox.commands
            .run(`git diff --shortstat ${base_commit}..HEAD`, { cwd: REPO_DIR })
            .catch(() => null);

        const summary = result?.stdout.trim();
        if (!summary) return null;

        const count = (pattern: RegExp) => Number(pattern.exec(summary)?.[1] ?? 0);
        const files = count(/(\d+) files? changed/);
        if (!files) return null;

        return {
            kind: RunLogEventKind.ChangesSummary,
            files,
            insertions: count(/(\d+) insertions?\(\+\)/),
            deletions: count(/(\d+) deletions?\(-\)/),
        };
    }

    /**
     * The commits the run produced, oldest first.
     *
     * Read from git rather than from what the agent said it did: the agent commits its own work,
     * and this is the only account of it that cannot be wrong.
     */
    public static async commits_since(sandbox: Sandbox, base_commit: string): Promise<Committed[]> {
        if (!base_commit) return [];
        const result = await sandbox.commands
            .run(`git log --reverse --format=${COMMIT_FORMAT} ${base_commit}..HEAD`, {
                cwd: REPO_DIR,
            })
            .catch(() => null);

        return (result?.stdout ?? "")
            .split("\x1e")
            .map((entry) => entry.trim().split("\x1f"))
            .flatMap<Committed>(([sha, subject, body]) =>
                sha && subject
                    ? [
                          {
                              kind: RunLogEventKind.Committed,
                              sha,
                              subject,
                              body: body?.trim() || undefined,
                          },
                      ]
                    : [],
            );
    }

    public static async head_commit(sandbox_id: string): Promise<string> {
        const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.VM_E2B_API_KEY });
        const result = await sandbox.commands.run("git rev-parse HEAD", { cwd: REPO_DIR });
        return result.stdout.trim();
    }

    public static async create(timeout_ms: number = SANDBOX_TIMEOUT_MS): Promise<string> {
        const sandbox = await Sandbox.create(ENV.VM_SANDBOX_TEMPLATE, {
            apiKey: ENV.VM_E2B_API_KEY,
            timeoutMs: timeout_ms,
        });
        return sandbox.sandboxId;
    }

    public static async exec_command(sandbox_id: string, command: string): Promise<CommandResult> {
        const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.VM_E2B_API_KEY });
        const result = await sandbox.commands.run(command);
        return result;
    }

    public static async exec_js_code(sandbox_id: string, code: string): Promise<string> {
        const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.VM_E2B_API_KEY });
        const result = await sandbox.commands.run(`node -e '${code}'`);
        return result.stdout;
    }

    public static async take_snapshot(sandbox_id: string): Promise<SnapshotInfo> {
        const snapshot = await Sandbox.createSnapshot(sandbox_id, {
            apiKey: ENV.VM_E2B_API_KEY,
        });
        return snapshot;
    }

    public static async pause(sandbox_id: string): Promise<boolean> {
        const status = await Sandbox.pause(sandbox_id, { apiKey: ENV.VM_E2B_API_KEY });
        return status;
    }

    public static async destroy(sandbox_id: string): Promise<void> {
        const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.VM_E2B_API_KEY });
        await sandbox.kill();
    }

    /**
     * Re-point origin at a freshly minted installation token.
     *
     * clone_repo bakes a token into the remote, and those expire after an hour. A sandbox kept
     * across dispatches therefore pushes with the credential it was cloned with, which is fine for
     * minutes and useless by the afternoon.
     */
    public static async refresh_origin(
        sandbox: Sandbox,
        repo_url: string,
        token: string,
    ): Promise<void> {
        const authenticated = repo_url.replace("https://", `https://x-access-token:${token}@`);
        try {
            await sandbox.commands.run(`git remote set-url origin ${authenticated}`, {
                cwd: REPO_DIR,
            });
        } catch (error) {
            throw new Error(failure_sentence(describe_failure("refresh origin", error, [token])));
        }
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

        const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.VM_E2B_API_KEY });
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
            throw new Error(failure_sentence(describe_failure("clone repo", error, [token])));
        } finally {
            stream.flush();
        }

        const env_file = Object.entries(secrets)
            .map(([key, value]) => `${key}=${value}`)
            .join("\n");
        await sandbox.files.write(`${REPO_DIR}/.env`, env_file);

        await E2B.install_repo_dependencies(sandbox, log);
    }

    /**
     * Best-effort, and deliberately so.
     *
     * Repositories we cannot install — anything that is not a JavaScript project, or a JS one
     * whose install simply fails here — still solve fine without their dependencies; that is how
     * every issue was solved before this step existed. Failing the clone over it would turn a
     * missing convenience into a dead run.
     *
     * The one thing a failure must not leave behind is a half-installed tree. Running a package
     * manager fires the repository's `prepare` script, which is what arms hook managers like
     * husky, so an install that dies partway can leave a live pre-push hook that nothing in the
     * tree can satisfy — the exact state that made every push fail. Undo that arming rather than
     * hand the next step a repository that cannot push.
     */
    private static async install_repo_dependencies(sandbox: Sandbox, log: Logger): Promise<void> {
        const root_entries = (await sandbox.files.list(REPO_DIR)).map((entry) => entry.name);
        if (!has_node_project(root_entries)) {
            log.info("no package.json at the repository root — skipping dependency install");
            return;
        }

        try {
            await install_dependencies(sandbox, pick_package_manager(root_entries), log, false);
        } catch (error) {
            log.warn("dependency install failed — continuing without it", {
                error: String(error),
            });
            await sandbox.commands
                .run("git config --unset-all core.hooksPath", { cwd: REPO_DIR })
                .catch(() => null);
        }
    }

    public static validate_branch(branch: string): void {
        if (!SAFE_BRANCH.test(branch)) {
            throw new Error(`refusing to use unsafe branch name: ${branch}`);
        }
    }
}
