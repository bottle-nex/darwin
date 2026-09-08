import { prisma } from "@trydarwin/database";
import { to_plain_text } from "@trydarwin/types";
import type { Request, Response } from "express";

import { readable_issue_project } from "../../access-control/issue-access";
import { MESSAGE_REFERENCE_INCLUDE } from "../../services/service.message-references";
import ResponseWriter from "../../services/service.response";

const SENDER_SELECT = { select: { id: true, name: true, email: true, image: true } } as const;

type IssueReference = {
    id: string;
    createdAt: Date;
    messageId: string;
    message: string;
    sender: { id: string; name: string | null; email: string; image: string | null } | null;
    thread:
        | { kind: "issue"; issueId: string; issueNumber: number; issueTitle: string }
        | { kind: "project" }
        | { kind: "team"; teamId: string; teamName: string };
};

export default class IssueReferencesGetController {
    static async process(req: Request, res: Response) {
        try {
            const user = req.user;
            if (!user || !user.id) {
                ResponseWriter.not_authorized(res);
                return;
            }

            const issue_id = req.params.id as string;
            const project_id = await readable_issue_project(res, user.id, issue_id);
            if (!project_id) return;

            const rows = await prisma.messageReference.findMany({
                where: {
                    issueId: issue_id,
                    OR: [
                        { chat: { isDeleted: false } },
                        { projectChat: { isDeleted: false } },
                        {
                            teamChat: {
                                isDeleted: false,
                                team: { members: { some: { userId: user.id } } },
                            },
                        },
                    ],
                },
                orderBy: { createdAt: "desc" },
                take: 50,
                select: {
                    id: true,
                    createdAt: true,
                    chat: {
                        select: {
                            id: true,
                            message: true,
                            issueId: true,
                            sender: SENDER_SELECT,
                            issue: { select: { number: true, title: true } },
                            references: { include: MESSAGE_REFERENCE_INCLUDE },
                        },
                    },
                    projectChat: {
                        select: {
                            id: true,
                            message: true,
                            sender: SENDER_SELECT,
                            references: { include: MESSAGE_REFERENCE_INCLUDE },
                        },
                    },
                    teamChat: {
                        select: {
                            id: true,
                            message: true,
                            sender: SENDER_SELECT,
                            team: { select: { id: true, name: true } },
                            references: { include: MESSAGE_REFERENCE_INCLUDE },
                        },
                    },
                },
            });

            const references = rows.flatMap((row): IssueReference[] => {
                if (row.chat) {
                    return [
                        {
                            id: row.id,
                            createdAt: row.createdAt,
                            messageId: row.chat.id,
                            message: to_plain_text(row.chat.message, row.chat.references),
                            sender: row.chat.sender,
                            thread: {
                                kind: "issue" as const,
                                issueId: row.chat.issueId,
                                issueNumber: row.chat.issue.number,
                                issueTitle: row.chat.issue.title,
                            },
                        },
                    ];
                }
                if (row.projectChat) {
                    return [
                        {
                            id: row.id,
                            createdAt: row.createdAt,
                            messageId: row.projectChat.id,
                            message: to_plain_text(
                                row.projectChat.message,
                                row.projectChat.references,
                            ),
                            sender: row.projectChat.sender,
                            thread: { kind: "project" as const },
                        },
                    ];
                }
                if (row.teamChat) {
                    return [
                        {
                            id: row.id,
                            createdAt: row.createdAt,
                            messageId: row.teamChat.id,
                            message: to_plain_text(row.teamChat.message, row.teamChat.references),
                            sender: row.teamChat.sender,
                            thread: {
                                kind: "team" as const,
                                teamId: row.teamChat.team.id,
                                teamName: row.teamChat.team.name,
                            },
                        },
                    ];
                }
                return [];
            });

            ResponseWriter.success(res, { references }, "Issue references fetched successfully");
        } catch (err) {
            console.error("IssueReferencesGetController error: ", err);
            ResponseWriter.system_error(res);
        }
    }
}
