import { PlanStatus, prisma } from "@trymatcha/database";

export default class PlanService {
    // get_plan
    // set_plan
    // openrouter call
    // update project -> db call

    async get_plan(project_id: string) {
        const project = await prisma.project.findUnique({
            where: {
                id: project_id,
            },
            select: {
                planMd: true,
                planStatus: true,
            },
        });

        if (!project) {
            console.error("Project not found");
            return;
        }

        if (!project.planMd || project.planStatus !== PlanStatus.Ready) {
            console.error("Plan not found or is not ready.");
            return;
        }

        return { planMd: project.planMd };
    }
}
