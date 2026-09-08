import type { AgentQuestionType, Provider } from "@trydarwin/database";
import type { Request } from "express";

export type LinkedIdentity = {
    linkToken: string;
    externalUserId: string;
    externalChatId: string;
    credential: string | null;
};

export type DeliveryTarget = {
    externalChatId: string;
    credential: string | null;
};

export type OutboundQuestion = {
    id: string;
    type: AgentQuestionType;
    key: string;
    prompt: string;
    options: string[];
    secretUrl: string | null;
};

export type ParsedReply = {
    externalUserId: string;
    externalMessageId: string;
    value: string;
};

export interface ConnectorAdapter {
    provider: Provider;
    is_configured(): boolean;
    link_start(link_token: string): string;
    link_complete(payload: unknown): Promise<LinkedIdentity | null>;
    verify_request(req: Request): boolean;
    send_question(target: DeliveryTarget, question: OutboundQuestion): Promise<string>;
    parse_reply(payload: unknown): ParsedReply | null;
    supersede(target: DeliveryTarget, externalMessageId: string, reason: string): Promise<void>;
}

const registry: Partial<Record<Provider, ConnectorAdapter>> = {};

export function register_connector(adapter: ConnectorAdapter) {
    registry[adapter.provider] = adapter;
}

export function get_connector(provider: Provider): ConnectorAdapter | null {
    const adapter = registry[provider];
    if (!adapter?.is_configured()) return null;
    return adapter;
}

export function configured_providers(): Provider[] {
    return Object.values(registry)
        .filter((adapter) => adapter.is_configured())
        .map((adapter) => adapter.provider);
}
