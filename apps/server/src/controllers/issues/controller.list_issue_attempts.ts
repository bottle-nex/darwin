import { ActivityType, prisma } from "@trydarwin/database";
import type { ActivityPayloadMap } from "@trydarwin/types";
import type { Request, Response } from "express";
import z from "zod";

import { readable_issue_project } from "../../access-control/issue-access";
import ResponseWriter from "../../services/service.response";

const params_schema = z.object({
    id: z.string().min(1),
});

type RunStats = { commits?: number; filesChanged?: number } | null;

function stat(stats: unknown, key: "commits" | "filesChanged"): number | null {
    const value = (stats as RunStats)?.[key];
    return typeof value === "number" ? value : null;
}

export default class IssueAttemptListController {
    static async process(req: Request, res: Response) {
        const user = req.user;
        if (!user?.id) {
            ResponseWriter.not_authorized(res);
            return;
        }

        const { data: params, success } = params_schema.safeParse(req.params);
        if (!success) {
            ResponseWriter.invalid_data(res);
            return;
        }

        try {
            const project_id = await readable_issue_project(res, user.id, params.id);
            if (!project_id) return;

            const [issue, sessions, reopens] = await Promise.all([
                prisma.issue.findUniqueOrThrow({
                    where: { id: params.id },
                    select: { prNumber: true, prUrl: true, prTitle: true, resolvedAt: true },
                }),
                prisma.agentSession.findMany({
                    where: { issueId: params.id },
                    orderBy: { attemptNumber: "asc" },
                    select: {
                        id: true,
                        attemptNumber: true,
                        status: true,
                        model: true,
                        report: true,
                        error: true,
                        stats: true,
                        startedAt: true,
                        endedAt: true,
                    },
                }),
                prisma.issueActivity.findMany({
                    where: { issueId: params.id, type: ActivityType.IssueReopened },
                    orderBy: { seq: "asc" },
                    select: { payload: true, createdAt: true },
                }),
            ]);

            const note_for = new Map(
                reopens.map((row) => {
                    const payload = row.payload as unknown as ActivityPayloadMap["IssueReopened"];
                    return [
                        payload.attemptNumber,
                        {
                            note: payload.noteText ?? payload.note,
                            actorName: payload.actor?.name ?? null,
                            at: row.createdAt,
                        },
                    ];
                }),
            );

            ResponseWriter.success(
                res,
                {
                    pullRequest: issue.prNumber
                        ? {
                              number: issue.prNumber,
                              url: issue.prUrl,
                              title: issue.prTitle,
                              merged: issue.resolvedAt !== null,
                          }
                        : null,
                    attempts: sessions.map((session) => ({
                        id: session.id,
                        attemptNumber: session.attemptNumber,
                        status: session.status,
                        model: session.model,
                        report: session.report,
                        error: session.error,
                        commits: stat(session.stats, "commits"),
                        filesChanged: stat(session.stats, "filesChanged"),
                        startedAt: session.startedAt,
                        endedAt: session.endedAt,
                        reopenedBy: note_for.get(session.attemptNumber) ?? null,
                    })),
                },
                "Issue attempts fetched",
            );
        } catch (error) {
            console.error("IssueAttemptListController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
