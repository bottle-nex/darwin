import { prisma } from "@trydarwin/database";
import { OutboundSocketMessageType } from "@trydarwin/types";

const DARWIN_MARKER = '"DARWIN_RUN_';

/**
 * Ownership and routing for the Ask Darwin event stream.
 *
 * Note this check is stricter than {@link RunLogSocketHandler}'s: run logs are shared, so project
 * membership is enough there. A Darwin thread is one person's notebook, so the run must belong to
 * this project *and* this user.
 */
export default class DarwinRunSocketHandler {
    /**
     * @example
     * await DarwinRunSocketHandler.belongs_to("run_7f3d", projectId, userId); // true
     */
    static async belongs_to(run_id: string, project_id: string, user_id: string): Promise<boolean> {
        const run = await prisma.darwinRun.findUnique({
            where: { id: run_id },
            select: { thread: { select: { projectId: true, userId: true } } },
        });
        return run?.thread.projectId === project_id && run.thread.userId === user_id;
    }

    /**
     * The run a published frame is addressed to, or null when it is not a Darwin frame.
     *
     * The cheap string test runs first because every project-channel message passes through here,
     * and most of them are chat and issue broadcasts that would be parsed for nothing.
     */
    static target_run(message: string): string | null {
        if (!message.includes(DARWIN_MARKER)) return null;
        try {
            const parsed = JSON.parse(message) as { type?: string; runId?: string };
            const routed =
                parsed.type === OutboundSocketMessageType.DARWIN_RUN_APPENDED ||
                parsed.type === OutboundSocketMessageType.DARWIN_RUN_SEALED;
            return routed && parsed.runId ? parsed.runId : null;
        } catch {
            return null;
        }
    }
}
