import { prisma } from "@trymatcha/database";
import { OutboundSocketMessageType } from "@trymatcha/types";

const RUN_LOG_MARKER = '"RUN_LOG_';

export default class RunLogSocketHandler {
    static async belongs_to_project(run_id: string, project_id: string): Promise<boolean> {
        const session = await prisma.agentSession.findUnique({
            where: { id: run_id },
            select: { issue: { select: { projectId: true } } },
        });
        return session?.issue.projectId === project_id;
    }

    static target_run(message: string): string | null {
        if (!message.includes(RUN_LOG_MARKER)) return null;
        try {
            const parsed = JSON.parse(message) as { type?: string; runId?: string };
            const routed =
                parsed.type === OutboundSocketMessageType.RUN_LOG_APPENDED ||
                parsed.type === OutboundSocketMessageType.RUN_LOG_SEALED;
            return routed && parsed.runId ? parsed.runId : null;
        } catch {
            return null;
        }
    }
}
