import { IssueStatus, prisma, type Project } from "@trymatcha/database";
import { guard_services } from "..";

export const STUCK_CLAIM_SECONDS = 60_000;
export const RECONCILE_INTERVAL_MS = 30_000;
export const ORPHAN_TODO_MS = 30_000;

export default class Reconciler {
    static async sweep_stuck_routed_claims() {
        try {
            const cut_off = new Date(Date.now() - STUCK_CLAIM_SECONDS);
            const projects = await prisma.project.findMany({
                where: {
                    routingClaimedAt: {
                        lt: cut_off,
                    },
                },
                select: {
                    id: true,
                },
            });

            for (const p of projects) {
                await prisma.project.update({
                    where: {
                        id: p.id,
                    },
                    data: {
                        routingClaimedAt: null,
                    },
                });
                await guard_services.queue.enqueue_project(p.id);
            }
        } catch (err) {
            console.error("error while sweeping the stucked projects ", err);
        }
    }

    static async sweep_orphan_issues() {
        try {
            const cut_off = new Date(Date.now() - ORPHAN_TODO_MS);
            const issues = await prisma.issue.findMany({
                where: {
                    status: IssueStatus.Todo,
                    createdAt: {
                        lt: cut_off,
                    },
                },
                select: {
                    projectId: true,
                },
            });
            const project_ids = new Set(issues.map((i) => i.projectId));
            console.log("found issues in projects: ", project_ids)
            for (const projectId of project_ids) {
                await guard_services.queue.enqueue_project(projectId);
            }
        } catch (err) {
            console.error("error while sweeping orphan issues", err);
        }
    }

    static async start_sweeper() {
        console.log("sweeping both orphan todos");
        await Reconciler.sweep_stuck_routed_claims();
        await Reconciler.sweep_orphan_issues();
    }
}
