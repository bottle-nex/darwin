import { RunLogEventKind } from "@trydarwin/types";
import type { Sandbox } from "e2b";

import {
    COMMIT_FORMAT,
    ISSUE_PUSH_TIMEOUT_MS,
    REPO_DIR,
    validate_branch,
} from "./service.e2b.constants";
import type { ChangesSummary, Committed } from "./service.e2b.types";
import { IssueBranchPushError } from "./service.e2b.types";
import { describe_failure } from "./service.stream";

export default class IssueGit {
    public static async prepare_issue_branch(
        sandbox: Sandbox,
        issue_branch: string,
        base_branch: string,
        keep_local_work: boolean,
    ): Promise<boolean> {
        validate_branch(issue_branch);
        validate_branch(base_branch);

        const remote_branch = await sandbox.commands.run(
            `git ls-remote --heads origin refs/heads/${issue_branch}`,
            { cwd: REPO_DIR },
        );
        const already_pushed = Boolean(remote_branch.stdout.trim());

        // A push retry keeps local work: the commit exists only here, so resetting would destroy it.
        if (keep_local_work) return already_pushed;

        // Otherwise reset unconditionally — a retained sandbox's last-attempt commit would look "already done" to the next agent.
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

    public static async push_issue_branch(
        sandbox: Sandbox,
        issue_branch: string,
        secrets: string[],
    ): Promise<void> {
        validate_branch(issue_branch);
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

    public static async head_of(sandbox: Sandbox): Promise<string> {
        const result = await sandbox.commands
            .run("git rev-parse HEAD", { cwd: REPO_DIR })
            .catch(() => null);
        return result?.stdout.trim() ?? "";
    }

    // What the run changed since base_commit, read after the agent finishes since a shallow clone has no base branch to diff against.
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

    // The commits the run produced, oldest first — read from git rather than the agent's own account, since git can't be wrong about what it committed.
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
}
