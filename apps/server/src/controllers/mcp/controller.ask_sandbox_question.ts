import { prisma, SetupQuestionType, SetupStatus } from "@trymatcha/database";
import type { Request, Response } from "express";
import { z } from "zod";

import ResponseWriter from "../../services/service.response";

const body_schema = z.object({
    type: z.enum(SetupQuestionType),
    key: z.string().min(1),
    prompt: z.string().min(1),
    options: z.array(z.string()).optional(),
});

export default class AskSandboxQuestion {
    static async process(req: Request, res: Response) {
        try {
            const session_id = req.sandbox_session_id;
            if (!session_id) {
                ResponseWriter.not_authorized(res);
                return;
            }

            const { data, success } = body_schema.safeParse(req.body);
            if (!success) {
                ResponseWriter.invalid_data(res);
                return;
            }

            const [question] = await Promise.all([
                prisma.setupQuestion.create({
                    data: {
                        sessionId: session_id,
                        type: data.type,
                        key: data.key,
                        prompt: data.prompt,
                        options: data.options ?? [],
                    },
                }),
                prisma.setupSession.update({
                    where: { id: session_id },
                    data: { status: SetupStatus.WaitingOnUser },
                }),
            ]);

            // TODO: notify the project owner/team a setup question is waiting (email/push/socket)
            console.log(`[setup] session ${session_id} asked "${data.key}": ${data.prompt}`);

            ResponseWriter.created(res, { question_id: question.id });
        } catch (error) {
            console.error("error in asking sandbox question: ", error);
            ResponseWriter.system_error(res);
            return;
        }
    }
}
