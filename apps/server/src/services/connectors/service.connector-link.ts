import { randomBytes } from "node:crypto";

import { type Connector, ConnectorStatus, prisma, Provider } from "@trydarwin/database";

import { ENV } from "../../configs/env";
import SecretService from "../service.secret";
import { get_connector } from "./connector.type";

export default class ConnectorLinkService {
    static async start(user_id: string, provider: Provider): Promise<string | null> {
        const adapter = get_connector(provider);
        if (!adapter) return null;

        const token = randomBytes(32).toString("hex");

        await prisma.connectorLinkToken.create({
            data: {
                token,
                userId: user_id,
                provider,
                expiresAt: new Date(Date.now() + ENV.SERVER_CONNECTOR_LINK_TTL_SECONDS * 1000),
            },
        });

        return adapter.link_start(token);
    }

    static async complete(provider: Provider, payload: unknown): Promise<Connector | null> {
        const adapter = get_connector(provider);
        if (!adapter) return null;

        const identity = await adapter.link_complete(payload);
        if (!identity) return null;

        const link = await prisma.connectorLinkToken.findUnique({
            where: { token: identity.linkToken },
        });

        if (!link || link.provider !== provider) return null;
        if (link.consumedAt || link.expiresAt < new Date()) return null;

        const encrypted = identity.credential ? SecretService.encrypt(identity.credential) : null;

        const [connector] = await prisma.$transaction([
            prisma.connector.upsert({
                where: { userId_provider: { userId: link.userId, provider } },
                create: {
                    userId: link.userId,
                    provider,
                    externalUserId: identity.externalUserId,
                    externalChatId: identity.externalChatId,
                    ciphertext: encrypted?.ciphertext ?? null,
                    iv: encrypted?.iv ?? null,
                    authTag: encrypted?.authTag ?? null,
                },
                update: {
                    status: ConnectorStatus.Active,
                    revokedAt: null,
                    externalUserId: identity.externalUserId,
                    externalChatId: identity.externalChatId,
                    ciphertext: encrypted?.ciphertext ?? null,
                    iv: encrypted?.iv ?? null,
                    authTag: encrypted?.authTag ?? null,
                },
            }),
            prisma.connectorLinkToken.update({
                where: { id: link.id },
                data: { consumedAt: new Date() },
            }),
        ]);

        return connector;
    }

    static async list(user_id: string) {
        const connectors = await prisma.connector.findMany({
            where: { userId: user_id },
            select: { provider: true, status: true, connectedAt: true },
        });

        return Object.values(Provider).map((provider) => {
            const existing = connectors.find((connector) => connector.provider === provider);

            return {
                provider,
                available: Boolean(get_connector(provider)),
                connected: existing?.status === ConnectorStatus.Active,
                connectedAt: existing?.connectedAt ?? null,
            };
        });
    }

    static async disconnect(user_id: string, provider: Provider) {
        await prisma.connector.updateMany({
            where: { userId: user_id, provider },
            data: { status: ConnectorStatus.Revoked, revokedAt: new Date() },
        });
    }
}
