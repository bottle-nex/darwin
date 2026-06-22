import { prisma, IssueStatus, WorkerStatus, type Issue, type Worker } from "@trymatcha/database";
import type QueueService from "../services/services.queue";

// how many Todo issues we route in one pass, and how much recent history we
// hand the LLM as context — both tunable; cap by prompt token budget, not magic
const TODO_BATCH_LIMIT = 20;
const HISTORY_LIMIT = 20;

interface Assignment {
    issueId: string;
    workerId: string;
    specialization: string;
}

export default async function process_route_job(project_id: string, queue: QueueService) {
    // 1. fetch the Todo issues to route. empty is the COMMON case (server +
    //    reconciler both fire), so bail cheaply.
    const todo = await prisma.issue.findMany({
        where: { projectId: project_id, status: IssueStatus.Todo },
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
        take: TODO_BATCH_LIMIT,
    });
    if (todo.length === 0) return;

    // 2. gather the read-only context bundle for the LLM
    const [history, workers] = await Promise.all([
        prisma.issue.findMany({
            where: {
                projectId: project_id,
                status: { in: [IssueStatus.Done, IssueStatus.InReview] },
            },
            orderBy: { updatedAt: "desc" },
            take: HISTORY_LIMIT,
        }),
        prisma.worker.findMany({
            where: { projectId: project_id, status: { not: WorkerStatus.Dead } },
        }),
    ]);
    const plan_md = await fetch_plan_md(project_id);

    // decision: no workers available yet → leave issues Todo; reconciler retries
    if (workers.length === 0) return;

    // 3. ask Haiku who handles each issue
    const assignments = await route_with_haiku({ plan_md, history, workers, issues: todo });

    // 4. write assignments ATOMICALLY — all-or-nothing. if this throws before
    //    commit, the issues stay Todo and the job retries safely.
    await prisma.$transaction(async (tx) => {
        for (const a of assignments) {
            // atomic counter: increment returns the NEW value, so the position
            // this issue takes is (newValue - 1). race-safe under concurrency.
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

    // 5. doorbell each distinct worker that got new issues (one per worker)
    const worker_ids = [...new Set(assignments.map((a) => a.workerId))];
    await Promise.all(worker_ids.map((id) => queue.enqueue_dispatch(id)));
}

// TODO: fetch the project's plan.md from wherever you store it
// (cache / object storage / repo). returns the markdown string.
async function fetch_plan_md(project_id: string): Promise<string> {
    return "";
}

// TODO: build the system prompt + bundle, call Haiku (~2-3s), force structured
// JSON output, and validate every issue maps to a real worker in `workers`.
// leave anything it can't classify out of the result (stays Todo for next pass).
async function route_with_haiku(bundle: {
    plan_md: string;
    history: Issue[];
    workers: Worker[];
    issues: Issue[];
}): Promise<Assignment[]> {
    throw new Error("route_with_haiku not implemented");
}
