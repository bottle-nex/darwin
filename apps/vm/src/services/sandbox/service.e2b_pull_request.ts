import type { Sandbox } from "e2b";

import type { ClaimedIssue } from "../dispatch/service.issue_solver";
import GithubService, { type PullRequestSummary } from "../platform/service.github";
import { PR_BODY_PATH } from "./service.e2b.constants";

export default class PullRequestManager {
    public static async find_pull_request(
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

    public static async ensure_pull_request(
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
            const existing = await PullRequestManager.find_pull_request(
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
}
