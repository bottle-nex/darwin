import { Request, Response } from "express";
import z from "zod";
import { Action, Permissions } from "@trymatcha/access-control";
import { prisma } from "@trymatcha/database";
import Access from "../../access-control/access";
import MessageReactionService from "../../services/service.message-reactions";
import { MESSAGE_REFERENCE_INCLUDE } from "../../services/service.message-references";
import ResponseWriter from "../../services/service.response";

export default class TeamChatGetController {
    static params_schema = z.object({
        teamId: z.string().min(1),
    });

    static async process(req: Request, res: Response) {
        try {
            const user = req.user;
            if (!user?.id) {
                ResponseWriter.not_authorized(res);
                return;
            }

            const parsed = TeamChatGetController.params_schema.safeParse(req.params);
            if (!parsed.success) {
                ResponseWriter.invalid_data(res);
                return;
            }

            const role = await Access.team(user.id, parsed.data.teamId);
            if (!role || !Permissions.team(role, Action.team.read)) {
                ResponseWriter.not_authorized(res, "You dont have access to this team");
                return;
            }

            const chats = await prisma.teamChat.findMany({
                where: { teamId: parsed.data.teamId },
                orderBy: { createdAt: "asc" },
                include: {
                    sender: true,
                    repliedTo: { include: { sender: true } },
                    references: { include: MESSAGE_REFERENCE_INCLUDE },
                },
            });
            const reactions = await MessageReactionService.team_chat_summaries(
                chats.map((chat) => chat.id),
                user.id,
            );

            ResponseWriter.success(
                res,
                {
                    chats: chats.map((chat) => ({
                        ...chat,
                        reactions: reactions.get(chat.id) ?? [],
                    })),
                },
                "Team chats fetched successfully",
            );
        } catch (error) {
            console.error("TeamChatGetController error: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
