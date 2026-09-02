import { AgentQuestionType, prisma, SetupStatus } from "@trymatcha/database";
import type { Request, Response } from "express";
import { z } from "zod";

import { ENV } from "../../configs/env";
import ConnectorService from "../../services/connectors/service.connector";
import ResponseWriter from "../../services/service.response";

const body_schema = z.object({
    type: z.enum(AgentQuestionType),
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

            const expires_at = new Date(Date.now() + ENV.SERVER_AGENT_QUESTION_TTL_SECONDS * 1000);

            const [question] = await Promise.all([
                prisma.agentQuestion.create({
                    data: {
                        setupSessionId: session_id,
                        type: data.type,
                        key: data.key,
                        prompt: data.prompt,
                        options: data.options ?? [],
                        expiresAt: expires_at,
                    },
                }),
                prisma.setupSession.update({
                    where: { id: session_id },
                    data: { status: SetupStatus.WaitingOnUser },
                }),
            ]);

            const delivered = await ConnectorService.deliver(question);
            if (delivered === 0) {
                console.warn(
                    `[setup] session ${session_id} asked "${data.key}" with no reachable connector`,
                );
            }

            ResponseWriter.created(res, { question_id: question.id, delivered });
        } catch (error) {
            console.error("error in asking sandbox question: ", error);
            ResponseWriter.system_error(res);
            return;
        }
    }
}
