import { AgentQuestionStatus, AgentQuestionType, prisma } from "@trymatcha/database";
import type { Request, Response } from "express";
import { z } from "zod";

import { ENV } from "../../configs/env";
import { ConnectorService } from "../../services/connectors";
import ResponseWriter from "../../services/service.response";

const body_schema = z.object({
    type: z.enum(AgentQuestionType),
    key: z.string().min(1),
    prompt: z.string().min(1),
    options: z.array(z.string()).optional(),
});

const query_schema = z.object({ key: z.string().min(1) });

async function running_session_id(worker_id: string): Promise<string | null> {
    const session = await prisma.agentSession.findFirst({
        where: { workerId: worker_id, status: "Running" },
        orderBy: { startedAt: "desc" },
        select: { id: true },
    });

    return session?.id ?? null;
}

export default class AskWorkerQuestion {
    static async ask(req: Request, res: Response) {
        try {
            const worker_id = req.worker_id;
            if (!worker_id) {
                ResponseWriter.not_authorized(res);
                return;
            }

            const { data, success } = body_schema.safeParse(req.body);
            if (!success) {
                ResponseWriter.invalid_data(res);
                return;
            }

            const session_id = await running_session_id(worker_id);
            if (!session_id) {
                ResponseWriter.not_found(res, "No running agent session for this worker");
                return;
            }

            const question = await prisma.agentQuestion.create({
                data: {
                    agentSessionId: session_id,
                    type: data.type,
                    key: data.key,
                    prompt: data.prompt,
                    options: data.options ?? [],
                    expiresAt: new Date(Date.now() + ENV.SERVER_AGENT_QUESTION_TTL_SECONDS * 1000),
                },
            });

            const delivered = await ConnectorService.deliver(question);
            if (delivered === 0) {
                console.warn(
                    `[worker] ${worker_id} asked "${data.key}" with no reachable connector`,
                );
            }

            ResponseWriter.created(res, { question_id: question.id, delivered });
        } catch (error) {
            console.error("error in asking worker question: ", error);
            ResponseWriter.system_error(res);
        }
    }

    static async answer(req: Request, res: Response) {
        try {
            const worker_id = req.worker_id;
            if (!worker_id) {
                ResponseWriter.not_authorized(res);
                return;
            }

            const { data, success } = query_schema.safeParse(req.query);
            if (!success) {
                ResponseWriter.invalid_data(res);
                return;
            }

            const session_id = await running_session_id(worker_id);
            if (!session_id) {
                ResponseWriter.not_found(res, "No running agent session for this worker");
                return;
            }

            const question = await prisma.agentQuestion.findFirst({
                where: { agentSessionId: session_id, key: data.key },
                orderBy: { askedAt: "desc" },
            });

            if (!question) {
                ResponseWriter.not_found(res, "No such question");
                return;
            }

            if (question.status === AgentQuestionStatus.Cancelled) {
                ResponseWriter.custom(
                    res,
                    true,
                    "QUESTION_CANCELLED",
                    "nobody answered in time — proceed with your best judgement",
                    200,
                );
                return;
            }

            if (question.status !== AgentQuestionStatus.Answered) {
                ResponseWriter.custom(res, true, "WAITING_FOR_ANSWER", "waiting for answer", 202);
                return;
            }

            ResponseWriter.success(res, {
                value: question.answerValue,
                provided: Boolean(question.secretId),
            });
        } catch (error) {
            console.error("error in getting worker answer: ", error);
            ResponseWriter.system_error(res);
        }
    }
}
