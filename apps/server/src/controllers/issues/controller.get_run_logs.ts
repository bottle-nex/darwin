import { Action, Permissions } from "@trymatcha/access-control";
import { AgentSessionStatus, prisma } from "@trymatcha/database";
import { RUN_LOG_PAGE_LIMIT, type RunLogPage, RunLogState } from "@trymatcha/types";
import type { Request, Response } from "express";
import z from "zod";

import Access from "../../access-control/access";
import ResponseWriter from "../../services/service.response";
import RunLogService from "../../services/service.run-logs";

const params_schema = z.object({
    run_id: z.string().min(1),
});

const query_schema = z.object({
    cursor: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(RUN_LOG_PAGE_LIMIT).optional(),
});

export const RUN_LOG_SESSION_SELECT = {
    id: true,
    status: true,
    logsKey: true,
    logsDroppedLines: true,
    issue: { select: { projectId: true } },
} as const;

export async function readable_run(run_id: string, user_id: string) {
    const session = await prisma.agentSession.findUnique({
        where: { id: run_id },
        select: RUN_LOG_SESSION_SELECT,
    });
    if (!session) return { session: null, allowed: false };

    const role = await Access.project(user_id, session.issue.projectId);
    const allowed = Boolean(role && Permissions.project(role, Action.project.read));
    return { session, allowed };
}

export default class RunLogsGetController {
    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user?.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data: params, success: params_ok } = params_schema.safeParse(req.params);
        const { data: query, success: query_ok } = query_schema.safeParse(req.query);
        if (!params_ok || !query_ok) {
            ResponseWriter.invalid_data(res);
            return;
        }

        try {
            const { session, allowed } = await readable_run(params.run_id, user.id);
            if (!session) {
                ResponseWriter.not_found(res, "Run not found");
                return;
            }
            if (!allowed) {
                ResponseWriter.not_authorized(res, "You dont have access to the project");
                return;
            }

            const running = session.status === AgentSessionStatus.Running;
            const slice = await RunLogService.read_page(
                params.run_id,
                session.logsKey,
                query.cursor ?? null,
                query.limit ?? RUN_LOG_PAGE_LIMIT,
            );

            const page: RunLogPage = {
                runId: params.run_id,
                state: RunLogsGetController.state(running, slice.events.length, session.logsKey),
                events: slice.events,
                cursor: slice.cursor,
                droppedEvents: Math.max(slice.droppedEvents, session.logsDroppedLines),
                truncated: slice.truncated,
            };
            ResponseWriter.success(res, page, "Run logs fetched");
        } catch (error) {
            console.error("RunLogsGetController error: ", error);
            ResponseWriter.system_error(res);
        }
    }

    private static state(running: boolean, found: number, logs_key: string | null): RunLogState {
        if (running) return RunLogState.Live;
        if (found > 0 || logs_key) return RunLogState.Sealed;
        return RunLogState.Absent;
    }
}
