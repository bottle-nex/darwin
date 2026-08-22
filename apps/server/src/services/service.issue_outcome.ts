import { ActivityType, ActorType, IssueStatus, prisma } from "@trymatcha/database";
import { OutboundSocketMessageType, type IssueOutcomeJobData } from "@trymatcha/types";
import { server_services } from "..";
import ActivityService, { type ActivityEvent } from "./service.activity";
import { location_of } from "./service.activity-diff";
import AgentSessionService from "./service.agent-session";
import GithubService from "./service.github";
import ProductDiffService from "./service.product_diff";

type PrOpened = Extract<IssueOutcomeJobData, { kind: "pr_opened" }>;
type Failed = Extract<IssueOutcomeJobData, { kind: "failed" }>;

export const GIVE_UP_AFTER_MS = 15 * 60_000;

export class IssueOutcomeConflict extends Error {}

export default class IssueOutcomeService {
    static async pr_opened(data: PrOpened): Promise<void> {
        const issue = await this.owned_issue(data.issueId, data.workerId);
        console.log("recieeeeewed the event ::::::::::::: ");
        if (issue.prBranch !== data.branch) {
            throw new IssueOutcomeConflict("PR branch does not match the expected issue branch");
        }
        if (issue.prUrl && issue.prUrl !== data.prUrl) {
            throw new IssueOutcomeConflict("A different PR is already recorded for this issue");
        }
        const session = await this.session_for(data);

        const completion = await prisma.$transaction(async (transaction) => {
            const update = await transaction.issue.updateMany({
                where: {
                    id: data.issueId,
                    status: IssueStatus.InProgress,
                    prBranch: data.branch,
                },
                data: { status: IssueStatus.InReview, prUrl: data.prUrl },
            });

            await transaction.worker.update({
                where: { id: data.workerId },
                data: {
                    contextSummary: {
                        lastIssueId: data.issueId,
                        lastPrUrl: data.prUrl,
                        lastBranch: data.branch,
                        lastSummary: data.summary,
                        reportedAt: new Date().toISOString(),
                    },
                },
            });

            return this.finish(transaction, {
                issueId: data.issueId,
                workerId: data.workerId,
                sessionId: session?.id,
                transitioned: update.count === 1,
                events: [
                    {
                        type: ActivityType.PrOpened,
                        payload: { url: data.prUrl },
                        dedupeKey: `pr:${data.prUrl}`,
                    },
                    {
                        type: ActivityType.StatusChanged,
                        payload: {
                            from: location_of(issue.status, issue.customColumn),
                            to: { kind: "status", status: IssueStatus.InReview },
                        },
                    },
                ],
            });
        });

        console.log("completion : ", completion);

        await this.broadcast(completion, issue);

        try {
            const product_diff = await ProductDiffService.prepare(data.issueId);
            console.log("product diff : ", product_diff);
            if (product_diff) {
                await server_services.queue.enqueue_product_diff(product_diff.id);
            }
        } catch (error) {
            console.error("product diff preparation failed", error);
        }
    }

    static async failed(data: Failed): Promise<void> {
        const issue = await this.owned_issue(data.issueId, data.workerId);
        const session = await this.session_for(data);

        const attempt: ActivityEvent[] = session
            ? [
                  {
                      type: ActivityType.AttemptFailed,
                      payload: { attemptNumber: session.attemptNumber, reason: data.reason },
                      dedupeKey: `run:${session.id}:failed`,
                  },
              ]
            : [];

        const completion = await prisma.$transaction(async (transaction) => {
            const update = await transaction.issue.updateMany({
                where: { id: data.issueId, status: IssueStatus.InProgress },
                data: { status: IssueStatus.Failed },
            });

            return this.finish(transaction, {
                issueId: data.issueId,
                workerId: data.workerId,
                sessionId: session?.id,
                transitioned: update.count === 1,
                events: [
                    ...attempt,
                    {
                        type: ActivityType.StatusChanged,
                        payload: {
                            from: location_of(issue.status, issue.customColumn),
                            to: { kind: "status", status: IssueStatus.Failed },
                        },
                    },
                ],
            });
        });

        await this.broadcast(completion, issue);
    }

    static async reconcile(issueId: string): Promise<void> {
        const issue = await prisma.issue.findUnique({
            where: { id: issueId },
            select: {
                number: true,
                title: true,
                status: true,
                prUrl: true,
                prBranch: true,
                agentDoneAt: true,
                assignerWorkerId: true,
                project: {
                    select: {
                        githubRepoFullName: true,
                        githubInstallation: { select: { installationId: true } },
                    },
                },
            },
        });
        if (!issue || issue.status !== IssueStatus.InProgress) return;

        const { assignerWorkerId: workerId, prBranch: branch } = issue;
        if (!workerId || !branch) return;

        const apply = (prUrl: string) =>
            this.pr_opened({
                kind: "pr_opened",
                issueId,
                workerId,
                prUrl,
                branch,
                summary: `Completed issue #${issue.number}: ${issue.title}`,
            });

        if (issue.prUrl) {
            await apply(issue.prUrl);
            return;
        }

        const found = await this.open_pull_request_for(branch, issue.project);
        if (found) {
            await prisma.issue.update({ where: { id: issueId }, data: { prUrl: found.url } });
            await apply(found.url);
            return;
        }

        if (issue.agentDoneAt && Date.now() - issue.agentDoneAt.getTime() > GIVE_UP_AFTER_MS) {
            await this.failed({
                kind: "failed",
                issueId,
                workerId,
                reason: "agent finished without opening a pull request",
            });
        }
    }

    private static async open_pull_request_for(
        branch: string,
        project: {
            githubRepoFullName: string | null;
            githubInstallation: { installationId: bigint } | null;
        },
    ) {
        const { githubRepoFullName, githubInstallation } = project;
        if (!githubRepoFullName || !githubInstallation) return null;

        const [owner, repo] = githubRepoFullName.split("/");
        if (!owner || !repo) return null;

        return GithubService.findOpenPullRequestByBranch(
            Number(githubInstallation.installationId),
            owner,
            repo,
            branch,
        );
    }

    private static session_for(data: PrOpened | Failed) {
        if (!data.runId) return Promise.resolve(null);
        return AgentSessionService.resolve_for_worker(data.runId, data.issueId, data.workerId);
    }

    private static async owned_issue(issue_id: string, worker_id: string) {
        const issue = await prisma.issue.findUnique({
            where: { id: issue_id },
            select: {
                assignerWorkerId: true,
                status: true,
                customColumnId: true,
                prUrl: true,
                prBranch: true,
                customColumn: { select: { id: true, label: true } },
            },
        });
        if (!issue || issue.assignerWorkerId !== worker_id) {
            throw new IssueOutcomeConflict("Issue is not assigned to this worker");
        }
        return issue;
    }

    private static async finish(
        transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
        input: {
            issueId: string;
            workerId: string;
            sessionId?: string;
            transitioned: boolean;
            events: ActivityEvent[];
        },
    ) {
        const issue = await transaction.issue.findUniqueOrThrow({
            where: { id: input.issueId },
            include: { creator: true, assignees: true, tags: true },
        });
        if (!input.transitioned) return { issue, transitioned: false, activities: [] };

        const activities = await ActivityService.emit(transaction, {
            issueId: input.issueId,
            actor: { type: ActorType.Agent, workerId: input.workerId },
            sessionId: input.sessionId,
            events: input.events,
        });

        return { issue, transitioned: true, activities };
    }

    private static async broadcast(
        completion: {
            issue: { projectId: string; id: string };
            transitioned: boolean;
            activities: { seq: bigint }[];
        },
        previous: { status: IssueStatus; customColumnId: string | null },
    ) {
        if (!completion.transitioned) return;

        const project_id = completion.issue.projectId;
        await server_services.publisher.publish_message(
            server_services.publisher.get_channel_name(project_id),
            JSON.stringify({
                type: OutboundSocketMessageType.ISSUE_UPDATED,
                projectId: project_id,
                payload: completion.issue,
                previous,
            }),
        );
        await ActivityService.publish(project_id, completion.issue.id, completion.activities);
    }
}
