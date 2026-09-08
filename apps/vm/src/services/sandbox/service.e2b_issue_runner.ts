import { randomUUID } from "node:crypto";

import { ExecutionMode, Harness, prisma } from "@trymatcha/database";
import type { AgentHarness, McpServerSpec } from "@trymatcha/harness";
import { Registry } from "@trymatcha/harness";
import type Logger from "@trymatcha/logger";
import { format_duration } from "@trymatcha/logger";
import { RunLogEventKind, type RunLogMilestoneBody, RunLogPhase } from "@trymatcha/types";
import type { Sandbox } from "e2b";

import { ENV } from "../../conf/config.env";
import GraphService, {
    GRAPHIFY_INTEGRATION,
    GRAPHIFY_OUT,
    GRAPHIFY_SETTINGS,
} from "../context/service.graph";
import type { ClaimedIssue } from "../dispatch/service.issue_solver";
import OutcomeReporter from "../dispatch/service.outcome_queue";
import { resolve_harness_env } from "../harness/service.credentials";
import HarnessRun, { type AgentReport } from "../harness/service.run";
import type { PullRequestSummary } from "../platform/service.github";
import { sign_worker_jwt } from "../platform/service.jwt";
import RunLogRegistry from "../run_log/service.registry";
import RunReporter from "../run_log/service.report";
import RunLogWriter from "../run_log/service.writer";
import {
    BASE_MCP_SERVER,
    ISSUE_PROMPT_PATH,
    ISSUE_SOLVE_TIMEOUT_MS,
    PR_BODY_PATH,
    REPO_DIR,
    SOLVE_REPORT_MAX_CHARS,
    SOLVE_REPORT_PATH,
    WORKER_SANDBOX_TIMEOUT_MS,
} from "./service.e2b.constants";
import type { SolveContext } from "./service.e2b.types";
import IssueGit from "./service.e2b_git";
import IssuePromptBuilder from "./service.e2b_issue_prompt";
import PullRequestManager from "./service.e2b_pull_request";
import { requires_agent_run } from "./service.e2b_worker_state";
import { describe_failure, failure_sentence } from "./service.stream";

type GraphState = Awaited<ReturnType<typeof GraphService.prepare>>;

interface AgentRun {
    context: SolveContext;
    issue: ClaimedIssue;
    agent: AgentHarness;
    run_id: string;
    run_worker_token: string;
}

interface AgentWorkspace {
    mcp_config_path: string;
    graph_state: GraphState;
    is_claude: boolean;
}

interface AgentRunResult {
    run_id: string;
    run_worker_token: string;
    run_writer: RunLogWriter;
}

interface UnpushedWorkState {
    ran_agent: boolean;
    resuming_push: boolean;
    existing_pull: PullRequestSummary | null;
    already_pushed: boolean;
    run_worker_token: string | undefined;
}

export default class IssueRunner {
    public static async solve_one_issue(
        context: SolveContext,
        issue: ClaimedIssue,
        on_run_started: (run_id: string) => void,
    ): Promise<void> {
        const { sandbox, log } = context;

        const existing_pull = await PullRequestManager.find_pull_request(
            context.ghToken,
            context.repoFullName,
            context.repoOwner,
            issue.prBranch,
            context.baseBranch,
        );

        const resuming_push = context.pushRetryIssueId === issue.id;
        const already_pushed = await IssueGit.prepare_issue_branch(
            sandbox,
            issue.prBranch,
            context.baseBranch,
            resuming_push,
        );

        const base_commit = await IssueGit.head_of(sandbox);
        const ran_agent = requires_agent_run(issue.agentDoneAt, resuming_push);

        const agent_run = ran_agent
            ? await IssueRunner.run_agent(context, issue, base_commit, on_run_started)
            : null;

        if (!agent_run) {
            log.info(`no agent work owed for issue #${issue.number}`, {
                branch: issue.prBranch,
                pull: existing_pull?.number ?? "none",
                pushed: already_pushed,
                retryingPush: resuming_push,
            });
        }

        await IssueRunner.push_branch_if_needed(context, issue, {
            ran_agent,
            resuming_push,
            existing_pull,
            already_pushed,
            run_worker_token: agent_run?.run_worker_token,
        });

        if (issue.agentDoneAt === null) {
            await prisma.issue.update({
                where: { id: issue.id },
                data: { agentDoneAt: new Date() },
            });
        }

        if (
            await IssueRunner.hand_off_for_manual_review(context, issue, existing_pull, agent_run)
        ) {
            return;
        }

        await IssueRunner.finalize_pull_request(context, issue, existing_pull, agent_run);
    }

    private static async run_agent(
        context: SolveContext,
        issue: ClaimedIssue,
        base_commit: string,
        on_run_started: (run_id: string) => void,
    ): Promise<AgentRunResult> {
        const run = await IssueRunner.begin_agent_run(context, issue, on_run_started);
        const workspace = await IssueRunner.prepare_agent_workspace(run, context);
        const run_writer = await IssueRunner.execute_agent(run, workspace, base_commit);

        return { run_id: run.run_id, run_worker_token: run.run_worker_token, run_writer };
    }

    private static async begin_agent_run(
        context: SolveContext,
        issue: ClaimedIssue,
        on_run_started: (run_id: string) => void,
    ): Promise<AgentRun> {
        const { harness, model, effort } = issue;
        const agent = Registry.get(harness);

        const run_id = randomUUID();
        on_run_started(run_id);
        const run_worker_token = sign_worker_jwt(context.workerId);

        const version_result = await context.sandbox.commands
            .run(`${agent.binary} --version`)
            .catch(() => null);
        const harness_version = version_result?.stdout?.trim() || undefined;

        await RunReporter.started(
            run_worker_token,
            { run_id, issue_id: issue.id, harness, model, effort, harness_version },
            context.log,
        );

        return { context, issue, agent, run_id, run_worker_token };
    }

    private static async prepare_agent_workspace(
        run: AgentRun,
        context: SolveContext,
    ): Promise<AgentWorkspace> {
        const { issue, agent, run_id, run_worker_token } = run;
        const { sandbox, log } = context;

        // graphify installs first so its OpenCode config write doesn't get clobbered by ours (order matters, must merge).
        const is_claude = issue.harness === Harness.Claude;
        const graph_state = await GraphService.prepare(sandbox, log, issue.harness);

        const mcp_config_path = agent.mcpConfigPath();
        const existing_mcp_config = await sandbox.files.read(mcp_config_path).catch(() => null);
        // The run's identity/log endpoint live on the MCP server's own env, since the agent spawns it as a child with a restricted environment.
        const run_mcp_server: McpServerSpec = {
            ...BASE_MCP_SERVER,
            env: {
                ...BASE_MCP_SERVER.env,
                MATCHA_SANDBOX_TOKEN: run_worker_token,
                MATCHA_RUN_ID: run_id,
                ...(ENV.VM_PUBLIC_URL ? { MATCHA_VM_URL: ENV.VM_PUBLIC_URL } : {}),
            },
        };
        await sandbox.files.write(
            mcp_config_path,
            agent.buildMcpConfig(run_mcp_server, existing_mcp_config),
        );

        log.step(`issue #${issue.number} pushed into sandbox`, { title: issue.title });
        await sandbox.files.write(
            ISSUE_PROMPT_PATH,
            IssuePromptBuilder.build(
                issue,
                context.baseBranch,
                context.planMd,
                await IssueRunner.dependencies_installed(sandbox),
            ),
        );

        log.info(`invoking ${issue.harness} for issue #${issue.number}`, {
            model: issue.model,
            effort: issue.effort,
            attempt: issue.attemptNumber,
            brief: context.planMd ? "included" : "absent",
        });

        return { mcp_config_path, graph_state, is_claude };
    }

    private static async execute_agent(
        run: AgentRun,
        workspace: AgentWorkspace,
        base_commit: string,
    ): Promise<RunLogWriter> {
        const { context, issue, agent, run_id, run_worker_token } = run;
        const { mcp_config_path, graph_state, is_claude } = workspace;
        const { sandbox, log, secrets } = context;

        const run_writer = RunLogWriter.open(
            run_id,
            { projectId: context.projectId, issueId: issue.id },
            secrets(),
            log,
        );
        RunLogRegistry.register(run_id, run_writer, run_worker_token);

        let report: AgentReport;
        try {
            report = await HarnessRun.execute(sandbox, log, {
                harness: issue.harness,
                prompt_path: ISSUE_PROMPT_PATH,
                model: issue.model,
                effort: issue.effort,
                extra_flags: [
                    ...agent.mcpConfigFlags(mcp_config_path),
                    ...(is_claude && graph_state === "ready"
                        ? [`--settings ${GRAPHIFY_SETTINGS}`, `--add-dir ${GRAPHIFY_INTEGRATION}`]
                        : []),
                ],
                envs: {
                    ...(await resolve_harness_env(issue.harness, context.projectId)),
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
                on_observed: (event) => {
                    void run_writer
                        .write_observed(RunLogPhase.Agent, event)
                        .catch((error: unknown) =>
                            log.warn("observed run log event not stored", {
                                error: String(error),
                            }),
                        );
                },
            });
        } catch (error) {
            IssueRunner.emit_milestone(run_writer, log, RunLogPhase.Agent, {
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

        await IssueRunner.report_agent_success(run, run_writer, report, base_commit);

        return run_writer;
    }

    private static async report_agent_success(
        run: AgentRun,
        run_writer: RunLogWriter,
        report: AgentReport,
        base_commit: string,
    ): Promise<void> {
        const { context, issue, run_id, run_worker_token } = run;
        const { sandbox, log } = context;

        IssueRunner.emit_milestone(run_writer, log, RunLogPhase.Agent, {
            kind: RunLogEventKind.AgentFinished,
            durationMs: report.duration_ms,
        });

        for (const commit of await IssueGit.commits_since(sandbox, base_commit)) {
            IssueRunner.emit_milestone(run_writer, log, RunLogPhase.Publish, commit);
        }

        const changes = await IssueGit.changes_since(sandbox, base_commit);
        if (changes) IssueRunner.emit_milestone(run_writer, log, RunLogPhase.Publish, changes);

        RunLogRegistry.release(run_id);
        await RunReporter.completed(
            run_worker_token,
            run_id,
            issue.id,
            report,
            changes?.files,
            await IssueRunner.read_solve_report(sandbox),
            log,
        );

        log.success(`issue #${issue.number} run finished`, {
            turns: report.num_turns ?? "unknown",
            cost_usd: (report.total_cost_usd ?? 0).toFixed(4),
            duration: format_duration(report.duration_ms),
        });
        log.block(`final message from ${issue.harness}`, report.result ?? "(empty)");
    }

    private static async push_branch_if_needed(
        context: SolveContext,
        issue: ClaimedIssue,
        state: UnpushedWorkState,
    ): Promise<void> {
        const { ran_agent, resuming_push, existing_pull, already_pushed, run_worker_token } = state;
        const has_unpushed_work = ran_agent || resuming_push || (!existing_pull && !already_pushed);
        if (!has_unpushed_work) return;

        await IssueGit.push_issue_branch(context.sandbox, issue.prBranch, context.secrets());

        if (issue.executionMode === ExecutionMode.Manual && run_worker_token) {
            await RunReporter.notify(
                run_worker_token,
                issue.id,
                `Issue #${issue.number} "${issue.title}" is pushed to ${issue.prBranch}.`,
                context.log,
            );
        }
    }

    // Manual mode stops here: the branch is pushed and the decision is a person's, so the worker moves on rather than waiting.
    private static async hand_off_for_manual_review(
        context: SolveContext,
        issue: ClaimedIssue,
        existing_pull: PullRequestSummary | null,
        agent_run: AgentRunResult | null,
    ): Promise<boolean> {
        if (issue.executionMode !== ExecutionMode.Manual || existing_pull || !agent_run) {
            return false;
        }

        await RunReporter.request_pr_approval(
            agent_run.run_worker_token,
            issue.id,
            agent_run.run_id,
            await context.sandbox.files.read(PR_BODY_PATH).catch(() => ""),
            context.log,
        );

        context.log.info(`issue #${issue.number} awaiting pull request approval`);
        return true;
    }

    private static async finalize_pull_request(
        context: SolveContext,
        issue: ClaimedIssue,
        existing_pull: PullRequestSummary | null,
        agent_run: AgentRunResult | null,
    ): Promise<void> {
        const { sandbox, log, secrets } = context;
        const run_id = agent_run?.run_id;

        let pull_request: PullRequestSummary;
        try {
            pull_request =
                existing_pull ??
                (await PullRequestManager.ensure_pull_request(
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

        IssueRunner.emit_milestone(agent_run?.run_writer ?? null, log, RunLogPhase.Publish, {
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

    private static emit_milestone(
        run_writer: RunLogWriter | null,
        log: Logger,
        phase: RunLogPhase,
        event: RunLogMilestoneBody,
    ): void {
        void run_writer
            ?.write_observed(phase, event)
            .catch((error: unknown) =>
                log.warn("run log milestone not stored", { error: String(error) }),
            );
    }

    // Checked live rather than remembered from the clone, since a reused sandbox skips cloning and a failed install must not be reported as installed.
    private static async dependencies_installed(sandbox: Sandbox): Promise<boolean> {
        const result = await sandbox.commands
            .run(`test -d ${REPO_DIR}/node_modules`, { cwd: REPO_DIR })
            .catch(() => null);
        return result !== null;
    }

    // Only called when the agent actually ran — a resumed issue would otherwise blank the report an earlier run already wrote.
    private static async read_solve_report(sandbox: Sandbox): Promise<string | undefined> {
        const text = (await sandbox.files.read(SOLVE_REPORT_PATH).catch(() => "")).trim();
        return text ? text.slice(0, SOLVE_REPORT_MAX_CHARS) : undefined;
    }
}
