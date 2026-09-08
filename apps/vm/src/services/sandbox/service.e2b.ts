import type Logger from "@trydarwin/logger";
import type { CommandResult, SnapshotInfo } from "e2b";

import { validate_branch } from "./service.e2b.constants";
import type { ChangesSummary, Committed } from "./service.e2b.types";
import IssueGit from "./service.e2b_git";
import OnboardingRunner from "./service.e2b_onboarding";
import SandboxLifecycle from "./service.e2b_sandbox";
import WorkerLoop from "./service.e2b_worker_loop";

export { IssueBranchPushError } from "./service.e2b.types";
export { requires_agent_run } from "./service.e2b_worker_state";

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
