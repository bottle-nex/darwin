import { AgentQuestionStatus, prisma } from "@trydarwin/database";
import type { Request, Response } from "express";
import { z } from "zod";

import ResponseWriter from "../../services/service.response";

const query_schema = z.object({
    key: z.string().min(1),
});

export default class GetSandboxAnswer {
    static async process(req: Request, res: Response) {
        try {
            const session_id = req.sandbox_session_id;
            if (!session_id) {
                ResponseWriter.not_authorized(res);
                return;
            }

            const { data, success } = query_schema.safeParse(req.query);
            if (!success) {
                ResponseWriter.invalid_data(res);
                return;
            }

            const question = await prisma.agentQuestion.findFirst({
                where: { setupSessionId: session_id, key: data.key },
                orderBy: { askedAt: "desc" },
            });

            if (question?.status === AgentQuestionStatus.Cancelled) {
                ResponseWriter.custom(
                    res,
                    true,
                    "QUESTION_CANCELLED",
                    "nobody answered in time — proceed with your best judgement",
                    200,
                );
                return;
            }

            if (!question || question.status !== AgentQuestionStatus.Answered) {
                ResponseWriter.custom(res, true, "WAITING_FOR_ANSWER", "waiting for answer", 202);
                return;
            }

            ResponseWriter.success(res, {
                value: question.answerValue,
                provided: Boolean(question.secretId),
            });
        } catch (error) {
            console.error("error in getting sandbox answer: ", error);
            ResponseWriter.system_error(res);
            return;
        }
    }
}
