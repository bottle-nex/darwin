import { Request, Response } from "express";
import { z } from "zod";
import { prisma, SetupQuestionStatus } from "@trymatcha/database";
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

            const question = await prisma.setupQuestion.findFirst({
                where: { sessionId: session_id, key: data.key },
                orderBy: { askedAt: "desc" },
            });

            if (!question || question.status !== SetupQuestionStatus.Answered) {
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
