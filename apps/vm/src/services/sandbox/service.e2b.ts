<<<<<<< HEAD
import { randomUUID } from "node:crypto";

import { ExecutionMode, Harness, Prisma, prisma, WorkerStatus } from "@trydarwin/database";
import { type McpServerSpec, Registry } from "@trydarwin/harness";
import Logger, { format_duration } from "@trydarwin/logger";
import { RunLogEventKind, type RunLogMilestoneBody, RunLogPhase } from "@trydarwin/types";
=======
import type Logger from "@trymatcha/logger";
>>>>>>> b6fcad70 (updated e2b related files.)
import type { CommandResult, SnapshotInfo } from "e2b";

import { validate_branch } from "./service.e2b.constants";
import type { ChangesSummary, Committed } from "./service.e2b.types";
import IssueGit from "./service.e2b_git";
import OnboardingRunner from "./service.e2b_onboarding";
import SandboxLifecycle from "./service.e2b_sandbox";
import WorkerLoop from "./service.e2b_worker_loop";

<<<<<<< HEAD
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
=======
export { IssueBranchPushError } from "./service.e2b.types";
export { requires_agent_run } from "./service.e2b_worker_state";
>>>>>>> b6fcad70 (updated e2b related files.)

// Facade over the sandbox/worker/issue machinery split across this directory's service.e2b_* files, so outside consumers only ever import this one entry point.
export default class E2B {
    public static run_onboarding_job(
        session_id: string,
        project_id: string,
        github_repo_url: string,
        branch: string,
        installation_id: number,
    ): Promise<void> {
        return OnboardingRunner.run(
            session_id,
            project_id,
            github_repo_url,
            branch,
            installation_id,
        );
<<<<<<< HEAD

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
=======
>>>>>>> b6fcad70 (updated e2b related files.)
    }

    public static run_worker_loop(worker_id: string): Promise<void> {
        return WorkerLoop.run(worker_id);
    }

    public static create(timeout_ms?: number): Promise<string> {
        return SandboxLifecycle.create(timeout_ms);
    }

    public static exec_command(sandbox_id: string, command: string): Promise<CommandResult> {
        return SandboxLifecycle.exec_command(sandbox_id, command);
    }

    public static exec_js_code(sandbox_id: string, code: string): Promise<string> {
        return SandboxLifecycle.exec_js_code(sandbox_id, code);
    }

    public static take_snapshot(sandbox_id: string): Promise<SnapshotInfo> {
        return SandboxLifecycle.take_snapshot(sandbox_id);
    }

    public static pause(sandbox_id: string): Promise<boolean> {
        return SandboxLifecycle.pause(sandbox_id);
    }

    public static destroy(sandbox_id: string): Promise<void> {
        return SandboxLifecycle.destroy(sandbox_id);
    }

    public static head_commit(sandbox_id: string): Promise<string> {
        return SandboxLifecycle.head_commit(sandbox_id);
    }

    public static refresh_origin(
        sandbox: Parameters<typeof SandboxLifecycle.refresh_origin>[0],
        repo_url: string,
        token: string,
    ): Promise<void> {
        return SandboxLifecycle.refresh_origin(sandbox, repo_url, token);
    }

    public static clone_repo(
        sandbox_id: string,
        repo_url: string,
        branch: string,
        installation_id: number,
        project_id: string,
        log: Logger,
    ): Promise<void> {
        return SandboxLifecycle.clone_repo(
            sandbox_id,
            repo_url,
            branch,
            installation_id,
            project_id,
            log,
        );
    }

    public static validate_branch(branch: string): void {
        validate_branch(branch);
    }

    public static push_issue_branch(
        sandbox: Parameters<typeof IssueGit.push_issue_branch>[0],
        issue_branch: string,
        secrets: string[],
    ): Promise<void> {
        return IssueGit.push_issue_branch(sandbox, issue_branch, secrets);
    }

    public static head_of(sandbox: Parameters<typeof IssueGit.head_of>[0]): Promise<string> {
        return IssueGit.head_of(sandbox);
    }

    public static changes_since(
        sandbox: Parameters<typeof IssueGit.changes_since>[0],
        base_commit: string,
    ): Promise<ChangesSummary | null> {
        return IssueGit.changes_since(sandbox, base_commit);
    }

    public static commits_since(
        sandbox: Parameters<typeof IssueGit.commits_since>[0],
        base_commit: string,
    ): Promise<Committed[]> {
        return IssueGit.commits_since(sandbox, base_commit);
    }
}
