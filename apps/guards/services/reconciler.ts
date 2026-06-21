import { prisma, type Project } from "@trymatcha/database";

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
                await this.ring(p.id);
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
                    status: "Todo",
                    createdAt: {
                        lt: cut_off,
                    },
                },
                select: {
                    projectId: true,
                },
            });
            const project_ids = new Set(issues.map((i) => i.projectId));
            for (const projectId of project_ids) await this.ring(projectId);
        } catch (err) {
            console.error("error while sweeping orphan issues", err);
        }
    }

    static async ring(projectId: Project["id"]) {}

    static async start_sweeper() {
        console.log("sweeping both orphan todos");
        await Reconciler.sweep_stuck_routed_claims();
        await Reconciler.sweep_orphan_issues();
    }
}
