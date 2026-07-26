import { IssueStatus, prisma, WorkerStatus } from "@trymatcha/database";

export default class IssueSolver {
    public static async solve_issue_for_worker_id(worker_id: string): Promise<void> {
        const issue = await prisma.issue.findFirst({
            where: { assignerWorkerId: worker_id, status: IssueStatus.Queued },
            orderBy: { queuePosition: "asc" },
        });

        if (!issue) {
            console.log(`no queued issue for worker ${worker_id}`);
            return;
        }

        const claim = await prisma.issue.updateMany({
            where: { id: issue.id, status: IssueStatus.Queued },
            data: { status: IssueStatus.InProgress },
        });

        if (claim.count === 0) {
            console.log(`issue ${issue.id} was already claimed, skipping`);
            return;
        }

        await prisma.worker.update({
            where: { id: worker_id },
            data: { status: WorkerStatus.Busy },
        });

        console.log(
            `worker ${worker_id} picked issue #${issue.number} at queue position ${issue.queuePosition}: ${issue.title}`,
        );
    }
}
