import { IssueStatus, prisma } from "@trymatcha/database";

export interface ClaimedIssue {
    id: string;
    number: number;
    title: string;
    description: string;
}

export default class IssueSolver {
    /**
     * Atomically claim the next Queued issue for a worker (Queued -> InProgress), ordered
     * by queuePosition. Returns null once there's nothing left — the loop-ending signal
     * E2B.run_worker_loop uses to know it's done.
     */
    public static async claim_next_issue(worker_id: string): Promise<ClaimedIssue | null> {
        const issue = await prisma.issue.findFirst({
            where: { assignerWorkerId: worker_id, status: IssueStatus.Queued },
            orderBy: { queuePosition: "asc" },
            select: { id: true, number: true, title: true, description: true },
        });

        if (!issue) {
            console.log(`[vm] no queued issue for worker ${worker_id}`);
            return null;
        }

        const claim = await prisma.issue.updateMany({
            where: { id: issue.id, status: IssueStatus.Queued },
            data: { status: IssueStatus.InProgress },
        });

        if (claim.count === 0) {
            console.log(`[vm] issue ${issue.id} was already claimed by another run, skipping`);
            return null;
        }

        console.log(`[vm] worker ${worker_id} claimed issue #${issue.number}: ${issue.title}`);
        return issue;
    }
}
