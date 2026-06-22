import { IssueStatus, prisma, WorkerStatus, type Issue, type Worker } from "@trymatcha/database";
import type QueueService from "../services/services.queue";

interface Assignment {
    issueId: string;
    workerId: string;
    specialization: string;
}

export default class RouterProcessor {
    static async process_route_job(projectId: string, queue: QueueService) {
        const todos = await prisma.issue.findMany({
            where: {
                projectId,
                status: IssueStatus.Todo,
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        if (todos.length === 0) {
            console.log("No issues found");
            return;
        }

        const [history, workers] = await Promise.all([
            prisma.issue.findMany({
                where: {
                    projectId,
                    status: {
                        in: [IssueStatus.Done, IssueStatus.InReview],
                    },
                },
                orderBy: {
                    updatedAt: "desc",
                },
                take: 20, // change this later
            }),
            prisma.worker.findMany({
                where: {
                    projectId,
                    status: {
                        not: WorkerStatus.Dead,
                    },
                },
            }),
        ]);

        if (workers.length === 0) {
            console.log("No active workers found");
            return;
        }

        const plan_md = await this.fetch_plan_md(projectId);

        const assignment_data = {
            projectId,
            plan_md,
            history,
            workers,
        };
        const assignments = await this.route_issues(assignment_data);

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
                        assignedWorkerId: a.workerId,
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

    static async fetch_plan_md(projectId: string): Promise<string> {
        return "";
    }

    static async route_issues(data: {
        projectId: string;
        plan_md: string;
        history: Issue[];
        workers: Worker[];
    }): Promise<Assignment[]> {
        // sys prompt + data + haiku call + parse
        throw new Error("route_issues not implemented");
    }
}
