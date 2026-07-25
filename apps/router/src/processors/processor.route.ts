import { IssueStatus, prisma, WorkerStatus, type Issue, type Worker } from "@trymatcha/database";
import type QueueService from "../services/services.queue";
import { ChatAnthropic } from "@langchain/anthropic";
import { ENV } from "../config/config.env";
import z from "zod";
import { RunnableSequence } from "@langchain/core/runnables";
import { routerPrompt } from "../prompts/prompt.router";
import chalk from "chalk";

interface Assignment {
    issueId: string;
    workerId: string;
    specialization: string;
}

const ai_value = z.object({
    assignments: z.array(
        z.object({
            issueId: z.string().nonempty(),
            workerId: z.string().nonempty(),
            specialization: z.string().nonempty().describe("describe the issue is specialized for"),
        }),
    ),
});

export default class RouterProcessor {
    static async process_route_job(projectId: string, queue: QueueService) {
        const claimed_at = new Date();
        const claim = await prisma.project.updateMany({
            where: { id: projectId, routingClaimedAt: null },
            data: { routingClaimedAt: claimed_at },
        });

        if (claim.count === 0) {
            console.log(`project ${projectId} is already being routed, skipping`);
            return;
        }

        try {
            await this.route_project(projectId, queue);
        } finally {
            await this.release_claim(projectId, claimed_at);
        }
    }

    static async release_claim(projectId: string, claimed_at: Date) {
        try {
            await prisma.project.updateMany({
                where: { id: projectId, routingClaimedAt: claimed_at },
                data: { routingClaimedAt: null },
            });
        } catch (err) {
            console.error(`failed to release routing claim on ${projectId}`, err);
        }
    }

    static async route_project(projectId: string, queue: QueueService) {
        console.log("fetching all the active workers and new issues");
        // get the new issues and active workers
        const [active_workers, todos] = await Promise.all([
            prisma.worker.findMany({
                where: {
                    projectId,
                    status: {
                        not: WorkerStatus.Dead,
                    },
                },
            }),
            prisma.issue.findMany({
                where: {
                    projectId,
                    status: IssueStatus.Todo,
                },
                orderBy: {
                    createdAt: "asc",
                },
            }),
        ]);

        console.log("workers: ", active_workers.length, "\nnew issues: ", todos.length);

        // check if there is some issue available
        if (todos.length === 0) {
            console.log("No issues found");
            return;
        }

        console.log("getting history and project's plan.md");
        // get the history issues and plan_md
        const [history, project] = await Promise.all([
            prisma.$transaction(async (tx) => {
                // history will look like { worker_id: issue1, issue2 }[]
                const history = new Map<string, Issue[]>();
                for (const worker of active_workers) {
                    const issues = await tx.issue.findMany({
                        where: {
                            projectId,
                            assignerWorkerId: worker.id,
                        },
                        orderBy: {
                            updatedAt: "desc",
                        },
                        take: 5,
                    });
                    history.set(worker.id, issues);
                }
                return history;
            }),
            prisma.project.findUnique({
                where: { id: projectId },
                select: { planMd: true, maxWorkers: true },
            }),
        ]);

        console.log("history: ", history.size);

        if (!project?.planMd) {
            console.log(chalk.red("no plan was found in project"));
            return;
        }

        const new_workers = await this.spin_up_workers(
            projectId,
            active_workers.length,
            todos.length,
            project.maxWorkers,
        );

        console.log("new workers spinned up: ", new_workers.length);

        const assignment_data = {
            plan_md: project.planMd,
            history,
            active_workers,
            new_workers,
            new_issues: todos,
        };
        const assignments: Assignment[] = await this.route_issues(assignment_data);

        await prisma.$transaction(async (tx) => {
            for (const a of assignments) {
                const w = await tx.worker.update({
                    where: { id: a.workerId },
                    data: { nextQueuePos: { increment: 1 } },
                    select: { nextQueuePos: true },
                });
                await tx.issue.update({
                    where: { id: a.issueId },
                    data: {
                        assignerWorkerId: a.workerId,
                        queuePosition: w.nextQueuePos - 1,
                        specialization: a.specialization,
                        status: IssueStatus.Queued,
                    },
                });
            }
        });

        const worker_ids = [...new Set(assignments.map((a) => a.workerId))];
        await Promise.all(worker_ids.map((id) => queue.enqueue_dispatch(id)));
    }

    static async spin_up_workers(
        projectId: string,
        active_worker_count: number,
        issue_count: number,
        maxWorkers: number,
    ): Promise<Worker[]> {
        // if the current worker count is greater than (or equal to) the count of issues
        // then no need of spinning new workers, and never exceed the project's maxWorkers cap
        const workers_to_create = Math.max(
            0,
            Math.min(issue_count, maxWorkers) - active_worker_count,
        );

        const new_workers: Worker[] = [];
        for (let i = 0; i < workers_to_create; i++) {
            console.log("worker should be created here");
            const worker = await prisma.worker.create({
                data: {
                    projectId,
                    status: WorkerStatus.Booting,
                },
            });
            new_workers.push(worker);
        }

        return new_workers;
    }

    static async route_issues(data: {
        plan_md: string;
        history: Map<string, Issue[]>;
        active_workers: Worker[];
        new_workers: Worker[];
        new_issues: Issue[];
    }): Promise<Assignment[]> {
        // call Haiku with the old and new issues and with the workers
        console.log("creating model");
        const model = new ChatAnthropic({
            apiKey: ENV.SERVER_ANTHROPIC_API_KEY,
            model: "claude-3-haiku-20240307",
        });

        console.log("creating chain");
        const chain = RunnableSequence.from([
            routerPrompt,
            model.withStructuredOutput(ai_value, { strict: true }),
        ]);

        console.log("shaping active workers");
        const active_workers_view = data.active_workers.map((worker) => ({
            id: worker.id,
            specialization: worker.specialization,
            status: worker.status,
            recentIssues: (data.history.get(worker.id) ?? []).map((issue) => ({
                id: issue.id,
                title: issue.title,
                status: issue.status,
            })),
        }));

        console.log("shaping new workers");
        const new_workers_view = data.new_workers.map((worker) => ({
            id: worker.id,
            status: worker.status,
        }));

        const new_issues_view = data.new_issues.map((issue) => ({
            id: issue.id,
            title: issue.title,
            summary: issue.summary,
            priority: issue.priority,
        }));

        console.log("this will fail as api key is wrong");
        const result = await chain.invoke({
            plan_md: data.plan_md,
            active_worker_count: active_workers_view.length,
            active_workers: JSON.stringify(active_workers_view),
            new_worker_count: new_workers_view.length,
            new_workers: JSON.stringify(new_workers_view),
            new_issues: JSON.stringify(new_issues_view),
        });

        return result.assignments;
    }
}
