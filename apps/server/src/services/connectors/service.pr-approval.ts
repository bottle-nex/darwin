import {
    type AgentQuestion,
    AgentQuestionStatus,
    AgentQuestionType,
    IssueStatus,
    prisma,
} from "@trydarwin/database";

import { ENV } from "../../configs/env";
import GithubAppService from "../service.github_app";
import ConnectorService from "./service.connector";

const APPROVALS = new Set(["approve", "approved", "yes", "y", "ok", "ship it"]);

function is_approval(value: string | null): boolean {
    return APPROVALS.has((value ?? "").trim().toLowerCase());
}

export default class PullRequestApprovalService {
    static question_key(issue_id: string): string {
        return `open_pull_request:${issue_id}`;
    }

    static async request(issue_id: string, session_id: string): Promise<AgentQuestion | null> {
        const issue = await prisma.issue.findUnique({
            where: { id: issue_id },
            select: { number: true, title: true, prBranch: true },
        });

        if (!issue) return null;

        const question = await prisma.agentQuestion.create({
            data: {
                agentSessionId: session_id,
                type: AgentQuestionType.ApprovePullRequest,
                key: this.question_key(issue_id),
                prompt: `Issue #${issue.number} "${issue.title}" is pushed to ${issue.prBranch}. Open the pull request?`,
                options: ["Approve", "Reject"],
                timeoutBehavior: "Deny",
                expiresAt: new Date(Date.now() + ENV.SERVER_AGENT_QUESTION_TTL_SECONDS * 1000),
            },
        });

        await prisma.issue.update({
            where: { id: issue_id },
            data: { status: IssueStatus.AwaitingApproval },
        });

        await ConnectorService.deliver(question);

        return question;
    }

    /**
     * Runs after an answer lands, whichever surface it came from. The pull request is opened here
     * rather than in the sandbox that produced the branch, because opening it is a GitHub API call
     * and nothing more — so a run does not have to hold a sandbox for however long a person takes
     * to answer.
     */
    static async settle(question: AgentQuestion): Promise<void> {
        if (question.type !== AgentQuestionType.ApprovePullRequest) return;
        if (question.status !== AgentQuestionStatus.Answered) return;

        const issue_id = question.key.split(":")[1];
        if (!issue_id) return;

        if (!is_approval(question.answerValue)) {
            await prisma.issue.update({
                where: { id: issue_id },
                data: { status: IssueStatus.InProgress },
            });

            await ConnectorService.notify_issue(
                issue_id,
                "Pull request rejected. The branch is still pushed and the issue is back in progress.",
            );
            return;
        }

        const issue = await prisma.issue.findUnique({
            where: { id: issue_id },
            select: {
                number: true,
                title: true,
                prBranch: true,
                prBody: true,
                project: {
                    select: {
                        githubRepoFullName: true,
                        githubDefaultBranch: true,
                        githubInstallation: { select: { installationId: true } },
                    },
                },
            },
        });

        const repo = issue?.project.githubRepoFullName;
        const installation = issue?.project.githubInstallation?.installationId;

        if (!issue || !repo || !installation || !issue.prBranch) {
            console.error(`cannot open pull request for issue ${issue_id}: project not connected`);
            return;
        }

        const [owner, name] = repo.split("/");
        const octokit = await GithubAppService.octokitFor(Number(installation));

        const pull = await octokit.request("POST /repos/{owner}/{repo}/pulls", {
            owner,
            repo: name,
            head: issue.prBranch,
            base: issue.project.githubDefaultBranch ?? "main",
            title: `${issue.title} (#${issue.number})`,
            body: issue.prBody?.trim() || `Resolves issue #${issue.number}: ${issue.title}`,
        });

        await prisma.issue.update({
            where: { id: issue_id },
            data: {
                status: IssueStatus.InReview,
                prUrl: pull.data.html_url,
                prNumber: pull.data.number,
                prTitle: pull.data.title,
            },
        });

        await ConnectorService.notify_issue(
            issue_id,
            `Pull request opened for issue #${issue.number}: ${pull.data.html_url}`,
        );
    }
}
