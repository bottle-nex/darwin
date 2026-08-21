import { Request, Response } from "express";
import { prisma } from "@trymatcha/database";
import { to_plain_text } from "@trymatcha/types";
import ResponseWriter from "../../services/service.response";
import Access from "../../access-control/access";
import { Action, Permissions } from "@trymatcha/access-control";
import { MESSAGE_REFERENCE_INCLUDE } from "../../services/service.message-references";

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
            const issue = await prisma.issue.findUnique({
                where: { id: issue_id },
                select: { id: true, projectId: true },
            });
            if (!issue) {
                ResponseWriter.not_found(res, "Issue not found");
                return;
            }

            const role = await Access.project(user.id, issue.projectId);
            if (!role || !Permissions.project(role, Action.project.read)) {
                ResponseWriter.not_authorized(res, "You dont have access to this project");
                return;
            }

            const rows = await prisma.messageReference.findMany({
                where: {
                    issueId: issue.id,
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
