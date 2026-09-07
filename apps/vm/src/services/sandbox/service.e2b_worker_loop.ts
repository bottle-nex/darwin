import { Prisma, prisma, WorkerStatus } from "@trymatcha/database";
import Logger from "@trymatcha/logger";
import { Sandbox } from "e2b";

import { ENV } from "../../conf/config.env";
import type { ClaimedIssue } from "../dispatch/service.issue_solver";
import IssueSolver from "../dispatch/service.issue_solver";
import OutcomeReporter from "../dispatch/service.outcome_queue";
import GithubService from "../platform/service.github";
import {
    MAX_PUSH_ATTEMPTS,
    validate_branch,
    WORKER_LEASE_MS,
    WORKER_LEASE_RENEW_MS,
    WORKER_SANDBOX_TIMEOUT_MS,
} from "./service.e2b.constants";
import type { SolveContext } from "./service.e2b.types";
import { IssueBranchPushError } from "./service.e2b.types";
import IssueRunner from "./service.e2b_issue_runner";
import SandboxLifecycle from "./service.e2b_sandbox";
import { pending_push_issue_id, previous_push_attempts } from "./service.e2b_worker_state";
import { describe_failure, failure_sentence, type FailureReport } from "./service.stream";

interface RepoConfig {
    repo_url: string;
    repo_full_name: string;
    repo_owner: string;
    branch: string;
    installation_id: number;
}

type FailureFields = () => Record<string, string>;

export default class WorkerLoop {
    public static async run(worker_id: string): Promise<void> {
        const log = Logger.scope(`vm:${worker_id.slice(-8)}`);
        
        const claimed = await WorkerLoop.claim_lease(worker_id);

        if (!claimed) {
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
            await WorkerLoop.drive(worker_id, log);
        } finally {
            clearInterval(renew_lease);
            await prisma.worker
                .update({ where: { id: worker_id }, data: { leaseExpiresAt: null } })
                .catch(() => undefined);
        }
    }

    // Claims this worker so two jobs can't drive it at once; the lease is renewed while running and lapses if the process crashes mid-run.
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

    private static load_worker(worker_id: string) {
        return prisma.worker.findUniqueOrThrow({
            where: { id: worker_id },
            include: { project: { include: { githubInstallation: true } } },
        });
    }

    private static async drive(worker_id: string, log: Logger): Promise<void> {
        const worker = await WorkerLoop.load_worker(worker_id);
        const repo = await WorkerLoop.resolve_repo_config(worker, worker_id, log);
        if (!repo) return;

        const { project } = worker;
        let sandbox_id = worker.sandboxId;
        let retain_sandbox = false;
        let gh_token = "";
        let current_issue: ClaimedIssue | null = null;
        let current_run_id: string | undefined;

        const secrets = () => [gh_token, ENV.VM_CLAUDE_CODE_OAUTH_TOKEN];
        const failure_fields: FailureFields = () => ({
            worker: worker_id,
            project: project.id,
            sandbox: sandbox_id ?? "none",
            issue: current_issue?.id ?? "none",
            number: current_issue ? `#${current_issue.number}` : "none",
            branch: current_issue?.prBranch ?? "none",
        });

        log.step("worker loop starting", {
            worker: worker_id,
            project: project.id,
            branch: repo.branch,
        });

        try {
            sandbox_id = await WorkerLoop.ensure_sandbox(
                sandbox_id,
                repo,
                project.id,
                worker_id,
                log,
            );
            const connection = await WorkerLoop.connect_worker_sandbox(
                worker_id,
                sandbox_id,
                repo,
                log,
            );
            gh_token = connection.gh_token;

            const context: SolveContext = {
                sandbox: connection.sandbox,
                log,
                workerId: worker_id,
                projectId: project.id,
                planMd: project.planMd,
                repoFullName: repo.repo_full_name,
                repoOwner: repo.repo_owner,
                baseBranch: repo.branch,
                ghToken: gh_token,
                secrets,
                pushRetryIssueId: pending_push_issue_id(worker),
            };

            await WorkerLoop.run_issue_queue(worker_id, context, log, {
                on_issue_claimed: (issue) => {
                    current_issue = issue;
                },
                on_run_started: (run_id) => {
                    current_run_id = run_id;
                },
            });
        } catch (error) {
            retain_sandbox = await WorkerLoop.handle_failure(
                worker,
                worker_id,
                error,
                current_issue,
                current_run_id,
                secrets,
                failure_fields,
                log,
            );
        } finally {
            await WorkerLoop.teardown(worker_id, sandbox_id, retain_sandbox, log);
        }
    }

    private static async resolve_repo_config(
        worker: Awaited<ReturnType<typeof WorkerLoop.load_worker>>,
        worker_id: string,
        log: Logger,
    ): Promise<RepoConfig | null> {
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
            return null;
        }

        const repo_full_name = project.githubRepoFullName;
        const [repo_owner] = repo_full_name.split("/");
        if (!repo_owner) throw new Error("project GitHub repository name is invalid");

        const branch = project.githubDefaultBranch;
        validate_branch(branch);

        return {
            repo_url: project.githubRepoUrl,
            repo_full_name,
            repo_owner,
            branch,
            installation_id: Number(project.githubInstallation.installationId),
        };
    }

    private static async ensure_sandbox(
        sandbox_id: string | null,
        repo: RepoConfig,
        project_id: string,
        worker_id: string,
        log: Logger,
    ): Promise<string> {
        if (sandbox_id) {
            log.info("reusing live sandbox", { sandbox: sandbox_id });
            return sandbox_id;
        }

        log.info("no live sandbox — creating one");
        const created_id = await SandboxLifecycle.create(WORKER_SANDBOX_TIMEOUT_MS);
        log.info("sandbox created", { sandbox: created_id });
        await prisma.worker.update({
            where: { id: worker_id },
            data: { sandboxId: created_id },
        });

        log.info("cloning repo into sandbox", { repo: repo.repo_url });
        await SandboxLifecycle.clone_repo(
            created_id,
            repo.repo_url,
            repo.branch,
            repo.installation_id,
            project_id,
            log,
        );
        log.info("clone complete");

        return created_id;
    }

    private static async connect_worker_sandbox(
        worker_id: string,
        sandbox_id: string,
        repo: RepoConfig,
        log: Logger,
    ): Promise<{ sandbox: Sandbox; gh_token: string }> {
        const sandbox = await Sandbox.connect(sandbox_id, { apiKey: ENV.VM_E2B_API_KEY });

        const gh_token = await GithubService.getInstallationToken(repo.installation_id);
        log.info("minted github token for the sandbox");

        await SandboxLifecycle.refresh_origin(sandbox, repo.repo_url, gh_token);

        log.info("worker marked Busy");
        await prisma.worker.update({
            where: { id: worker_id },
            data: { status: WorkerStatus.Busy },
        });

        return { sandbox, gh_token };
    }

    private static async run_issue_queue(
        worker_id: string,
        context: SolveContext,
        log: Logger,
        callbacks: {
            on_issue_claimed: (issue: ClaimedIssue | null) => void;
            on_run_started: (run_id: string) => void;
        },
    ): Promise<void> {
        let solved_count = 0;

        for (;;) {
            const issue = await IssueSolver.claim_next_issue(worker_id, log);
            callbacks.on_issue_claimed(issue);
            if (!issue) {
                log.success("queue empty — stopping loop", { solved: solved_count });
                break;
            }

            await IssueRunner.solve_one_issue(context, issue, callbacks.on_run_started);
            solved_count++;
        }

        log.info("worker marked Idle");
        await prisma.worker.update({
            where: { id: worker_id },
            data: { status: WorkerStatus.Idle, contextSummary: Prisma.DbNull },
        });
    }

    private static async handle_failure(
        worker: Awaited<ReturnType<typeof WorkerLoop.load_worker>>,
        worker_id: string,
        error: unknown,
        current_issue: ClaimedIssue | null,
        current_run_id: string | undefined,
        secrets: () => string[],
        failure_fields: FailureFields,
        log: Logger,
    ): Promise<boolean> {
        const failure = describe_failure(
            current_issue ? "run issue" : "start worker loop",
            error,
            secrets(),
        );
        const push_attempts =
            error instanceof IssueBranchPushError ? previous_push_attempts(worker) + 1 : 0;
        const retain_sandbox =
            error instanceof IssueBranchPushError && push_attempts < MAX_PUSH_ATTEMPTS;

        log.error("worker loop failed", new Error(failure.message), {
            ...failure_fields(),
            stage: failure.stage,
            ...(push_attempts > 0 && { attempt: `${push_attempts}/${MAX_PUSH_ATTEMPTS}` }),
        });

        await WorkerLoop.mark_worker_after_failure(
            worker_id,
            failure,
            current_issue,
            push_attempts,
            retain_sandbox,
            failure_fields,
            log,
        );

        if (!retain_sandbox && current_issue && error instanceof IssueBranchPushError) {
            await WorkerLoop.report_push_giveup(
                worker_id,
                current_issue,
                current_run_id,
                push_attempts,
                failure,
                failure_fields,
                log,
            );
        }

        return retain_sandbox;
    }

    private static async mark_worker_after_failure(
        worker_id: string,
        failure: FailureReport,
        current_issue: ClaimedIssue | null,
        push_attempts: number,
        retain_sandbox: boolean,
        failure_fields: FailureFields,
        log: Logger,
    ): Promise<void> {
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
    }

    private static async report_push_giveup(
        worker_id: string,
        current_issue: ClaimedIssue,
        current_run_id: string | undefined,
        push_attempts: number,
        failure: FailureReport,
        failure_fields: FailureFields,
        log: Logger,
    ): Promise<void> {
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
        }).catch((e) => log.error("could not report the failed issue", e, failure_fields()));
    }

    private static async teardown(
        worker_id: string,
        sandbox_id: string | null,
        retain_sandbox: boolean,
        log: Logger,
    ): Promise<void> {
        if (!sandbox_id) return;

        if (retain_sandbox) {
            log.info("retaining sandbox for branch push retry", { sandbox: sandbox_id });
            return;
        }

        log.info("tearing down sandbox", { sandbox: sandbox_id });
        let teardown_succeeded = false;
        try {
            await SandboxLifecycle.destroy(sandbox_id);
            teardown_succeeded = true;
            log.info("sandbox destroyed");
        } catch (e) {
            log.error("sandbox teardown failed", e, { sandbox: sandbox_id });
        }

        if (!teardown_succeeded) return;

        try {
            await prisma.worker.update({
                where: { id: worker_id },
                data: { sandboxId: null },
            });
        } catch (e) {
            log.error("could not clear destroyed sandbox", e, { sandbox: sandbox_id });
        }
    }
}
