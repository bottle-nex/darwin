import {
    type AgentQuestion,
    AgentQuestionStatus,
    AgentQuestionType,
    type Connector,
    ConnectorStatus,
    prisma,
    type Provider,
} from "@trymatcha/database";

import { ENV } from "../../configs/env";
import SecretService from "../service.secret";
import {
    type DeliveryTarget,
    get_connector,
    type OutboundQuestion,
    type ParsedReply,
} from "./connector.type";

export default class ConnectorService {
    static credential_of(connector: Connector): string | null {
        if (!connector.ciphertext || !connector.iv || !connector.authTag) return null;

        return SecretService.decrypt({
            ciphertext: connector.ciphertext,
            iv: connector.iv,
            authTag: connector.authTag,
        });
    }

    static target_of(connector: Connector): DeliveryTarget {
        return {
            externalChatId: connector.externalChatId,
            credential: this.credential_of(connector),
        };
    }

    static secret_url(question_id: string): string {
        return `${ENV.SERVER_WEB_URL}/questions/${question_id}/secret`;
    }

    static to_outbound(question: AgentQuestion): OutboundQuestion {
        return {
            id: question.id,
            type: question.type,
            key: question.key,
            prompt: question.prompt,
            options: question.options,
            secretUrl:
                question.type === AgentQuestionType.NeedSecret
                    ? this.secret_url(question.id)
                    : null,
        };
    }

    static async recipients_for(question_id: string): Promise<string[]> {
        const question = await prisma.agentQuestion.findUnique({
            where: { id: question_id },
            select: {
                setupSession: { select: { project: { select: { ownerId: true } } } },
                agentSession: {
                    select: {
                        issue: {
                            select: {
                                createdById: true,
                                assignees: { select: { id: true } },
                                project: { select: { ownerId: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!question) return [];

        if (question.agentSession) {
            const issue = question.agentSession.issue;
            const assignees = issue.assignees.map((assignee) => assignee.id);

            if (assignees.length > 0) return assignees;
            return [issue.createdById ?? issue.project.ownerId];
        }

        const owner = question.setupSession?.project.ownerId;
        return owner ? [owner] : [];
    }

    static async can_answer(question_id: string, user_id: string): Promise<boolean> {
        const recipients = await this.recipients_for(question_id);
        return recipients.includes(user_id);
    }

    static async active_connectors(user_id: string): Promise<Connector[]> {
        return prisma.connector.findMany({
            where: { userId: user_id, status: ConnectorStatus.Active },
        });
    }

    static async deliver(question: AgentQuestion): Promise<number> {
        const user_ids = await this.recipients_for(question.id);
        if (user_ids.length === 0) return 0;

        const connectors = (
            await Promise.all(user_ids.map((user_id) => this.active_connectors(user_id)))
        ).flat();

        const outbound = this.to_outbound(question);

        const sent = await Promise.all(
            connectors.map((connector) => this.deliver_one(connector, outbound)),
        );

        return sent.filter(Boolean).length;
    }

    private static async deliver_one(
        connector: Connector,
        outbound: OutboundQuestion,
    ): Promise<boolean> {
        const adapter = get_connector(connector.provider);
        if (!adapter) return false;

        try {
            const external_message_id = await adapter.send_question(
                this.target_of(connector),
                outbound,
            );

            await prisma.questionDelivery.create({
                data: {
                    questionId: outbound.id,
                    connectorId: connector.id,
                    externalMessageId: external_message_id,
                    externalChatId: connector.externalChatId,
                },
            });

            return true;
        } catch (error) {
            console.error(`failed delivering question over ${connector.provider}: `, error);
            return false;
        }
    }

    static async accept_reply(
        provider: Provider,
        reply: ParsedReply,
    ): Promise<AgentQuestion | null> {
        const delivery = await prisma.questionDelivery.findFirst({
            where: {
                externalMessageId: reply.externalMessageId,
                supersededAt: null,
                connector: {
                    provider,
                    status: ConnectorStatus.Active,
                    externalUserId: reply.externalUserId,
                },
            },
            include: { question: true, connector: true },
        });

        if (!delivery) return null;
        if (delivery.question.status !== AgentQuestionStatus.Waiting) return null;
        if (delivery.question.expiresAt && delivery.question.expiresAt < new Date()) return null;
        if (delivery.question.type === AgentQuestionType.NeedSecret) return null;

        const answered = await prisma.agentQuestion.update({
            where: { id: delivery.questionId },
            data: {
                answerValue: reply.value,
                status: AgentQuestionStatus.Answered,
                answeredAt: new Date(),
            },
        });

        await this.supersede_siblings(delivery.questionId, delivery.id, "answered elsewhere");

        return answered;
    }

    static async expire_stale(): Promise<number> {
        const stale = await prisma.agentQuestion.findMany({
            where: {
                status: AgentQuestionStatus.Waiting,
                expiresAt: { not: null, lt: new Date() },
            },
            select: { id: true },
        });

        for (const question of stale) {
            await prisma.agentQuestion.update({
                where: { id: question.id },
                data: { status: AgentQuestionStatus.Cancelled },
            });

            await this.supersede_siblings(question.id, "", "expired — no answer in time");
        }

        return stale.length;
    }

    static async supersede_siblings(question_id: string, keep_delivery_id: string, reason: string) {
        const siblings = await prisma.questionDelivery.findMany({
            where: { questionId: question_id, supersededAt: null, id: { not: keep_delivery_id } },
            include: { connector: true },
        });

        await Promise.all(
            siblings.map(async (sibling) => {
                const adapter = get_connector(sibling.connector.provider);
                if (adapter) {
                    try {
                        await adapter.supersede(
                            this.target_of(sibling.connector),
                            sibling.externalMessageId,
                            reason,
                        );
                    } catch (error) {
                        console.error("failed superseding stale question message: ", error);
                    }
                }

                await prisma.questionDelivery.update({
                    where: { id: sibling.id },
                    data: { supersededAt: new Date() },
                });
            }),
        );
    }
}
