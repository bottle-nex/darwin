import { AgentQuestionStatus, AgentQuestionType, prisma } from "@trydarwin/database";
import type { Request, Response } from "express";
import { z } from "zod";

import { ConnectorService } from "../../services/connectors";
import ResponseWriter from "../../services/service.response";
import SecretService from "../../services/service.secret";

const secret_schema = z.object({ value: z.string().min(1) });
const params_schema = z.object({ id: z.string().min(1) });
const answer_schema = z.object({ value: z.string().min(1).max(2000) });
const issue_params_schema = z.object({ issueId: z.string().min(1) });

async function load_question(question_id: string) {
    return prisma.agentQuestion.findUnique({
        where: { id: question_id },
        include: {
            setupSession: { select: { project: { select: { id: true, name: true } } } },
            agentSession: {
                select: { issue: { select: { project: { select: { id: true, name: true } } } } },
            },
        },
    });
}

type LoadedQuestion = NonNullable<Awaited<ReturnType<typeof load_question>>>;

function project_of(question: LoadedQuestion) {
    return question.setupSession?.project ?? question.agentSession?.issue.project ?? null;
}

export default class QuestionsController {
    static async get(req: Request, res: Response) {
        const params = params_schema.safeParse(req.params);
        if (!params.success) return ResponseWriter.invalid_data(res, "question id is required");

        try {
            const question = await load_question(params.data.id);
            if (!question) return ResponseWriter.not_found(res, "Question not found");

            if (!(await ConnectorService.can_answer(question.id, req.user.id))) {
                return ResponseWriter.not_authorized(res);
            }

            const project = project_of(question);

            return ResponseWriter.success(res, {
                id: question.id,
                key: question.key,
                prompt: question.prompt,
                type: question.type,
                status: question.status,
                projectName: project?.name ?? null,
            });
        } catch (error) {
            console.error("error in fetching question: ", error);
            return ResponseWriter.system_error(res);
        }
    }

    /**
     * The waiting questions for one issue, so a run parked on an approval can be unblocked from
     * the board as well as from chat. A connector that failed to deliver must not be the only
     * way through a gate.
     */
    static async for_issue(req: Request, res: Response) {
        const params = issue_params_schema.safeParse(req.params);
        if (!params.success) return ResponseWriter.invalid_data(res, "issue id is required");

        try {
            const questions = await prisma.agentQuestion.findMany({
                where: {
                    status: AgentQuestionStatus.Waiting,
                    agentSession: { issueId: params.data.issueId },
                },
                orderBy: { askedAt: "desc" },
                select: {
                    id: true,
                    key: true,
                    prompt: true,
                    type: true,
                    options: true,
                    askedAt: true,
                },
            });

            const answerable = [];
            for (const question of questions) {
                if (await ConnectorService.can_answer(question.id, req.user.id)) {
                    answerable.push(question);
                }
            }

            return ResponseWriter.success(res, answerable);
        } catch (error) {
            console.error("error in fetching issue questions: ", error);
            return ResponseWriter.system_error(res);
        }
    }

    static async answer(req: Request, res: Response) {
        const params = params_schema.safeParse(req.params);
        if (!params.success) return ResponseWriter.invalid_data(res, "question id is required");

        const parsed = answer_schema.safeParse(req.body);
        if (!parsed.success) return ResponseWriter.invalid_data(res, "value is required");

        try {
            const question = await load_question(params.data.id);
            if (!question) return ResponseWriter.not_found(res, "Question not found");

            if (!(await ConnectorService.can_answer(question.id, req.user.id))) {
                return ResponseWriter.not_authorized(res);
            }

            if (question.type === AgentQuestionType.NeedSecret) {
                return ResponseWriter.invalid_data(res, "Answer this one through the secret form");
            }

            if (question.status !== AgentQuestionStatus.Waiting) {
                return ResponseWriter.custom(
                    res,
                    false,
                    "QUESTION_CLOSED",
                    "This question is no longer waiting for an answer.",
                    409,
                );
            }

            const answered = await prisma.agentQuestion.update({
                where: { id: question.id },
                data: {
                    answerValue: parsed.data.value,
                    status: AgentQuestionStatus.Answered,
                    answeredAt: new Date(),
                },
            });

            console.log(`[user→agent] answered "${answered.key}" via web — ${parsed.data.value}`);

            await ConnectorService.supersede_siblings(question.id, "", "answered on the web");
            await ConnectorService.settle(answered);

            return ResponseWriter.success(res, null, "Answer recorded.");
        } catch (error) {
            console.error("error answering question: ", error);
            return ResponseWriter.system_error(res);
        }
    }

    static async answer_secret(req: Request, res: Response) {
        const parsed = secret_schema.safeParse(req.body);
        if (!parsed.success) return ResponseWriter.invalid_data(res, "value is required");

        const params = params_schema.safeParse(req.params);
        if (!params.success) return ResponseWriter.invalid_data(res, "question id is required");

        try {
            const question = await load_question(params.data.id);
            if (!question) return ResponseWriter.not_found(res, "Question not found");

            if (!(await ConnectorService.can_answer(question.id, req.user.id))) {
                return ResponseWriter.not_authorized(res);
            }

            if (question.type !== AgentQuestionType.NeedSecret) {
                return ResponseWriter.invalid_data(res, "This question does not take a secret");
            }

            if (question.status !== AgentQuestionStatus.Waiting) {
                return ResponseWriter.custom(
                    res,
                    false,
                    "QUESTION_CLOSED",
                    "This question is no longer waiting for an answer.",
                    409,
                );
            }

            const project = project_of(question);
            if (!project) return ResponseWriter.not_found(res, "Project not found");

            const secret = await SecretService.set_secret(
                project.id,
                question.key,
                parsed.data.value,
            );

            await prisma.agentQuestion.update({
                where: { id: question.id },
                data: {
                    secretId: secret.id,
                    status: AgentQuestionStatus.Answered,
                    answeredAt: new Date(),
                },
            });

            await ConnectorService.supersede_siblings(
                question.id,
                "",
                "answered securely on the web",
            );

            return ResponseWriter.success(res, null, "Secret saved.");
        } catch (error) {
            console.error("error in answering secret question: ", error);
            return ResponseWriter.system_error(res);
        }
    }
}
