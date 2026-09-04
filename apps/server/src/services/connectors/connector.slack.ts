import { createHmac, timingSafeEqual } from "node:crypto";

import { AgentQuestionType, Provider } from "@trydarwin/database";
import type { Request } from "express";

import { ENV } from "../../configs/env";
import {
    type ConnectorAdapter,
    type DeliveryTarget,
    type LinkedIdentity,
    type OutboundQuestion,
    type ParsedReply,
    register_connector,
} from "./connector.type";

const API_BASE = "https://slack.com/api";
// im:history is what makes a typed reply reach us at all: without it Slack delivers no
// message.im events, so the bot can post a question and never learn that it was answered.
const BOT_SCOPES = ["chat:write", "im:write", "im:history", "users:read"].join(",");
const SIGNATURE_VERSION = "v0";
const MAX_SIGNATURE_AGE_SECONDS = 300;

type SlackOAuthResponse = {
    ok: boolean;
    error?: string;
    access_token: string;
    team: { id: string };
    authed_user: { id: string };
};

type SlackBlockAction = {
    type: string;
    user: { id: string };
    message?: { ts: string };
    container?: { message_ts?: string };
    actions?: { value?: string; selected_option?: { value: string } }[];
};

type SlackEventCallback = {
    type: string;
    event?: {
        type: string;
        user?: string;
        text?: string;
        thread_ts?: string;
        bot_id?: string;
    };
};

const BUTTON_TYPES = new Set<AgentQuestionType>([
    AgentQuestionType.NeedChoice,
    AgentQuestionType.Confirm,
    AgentQuestionType.ApproveCost,
]);

class SlackConnector implements ConnectorAdapter {
    public readonly provider = Provider.Slack;

    public is_configured() {
        return Boolean(ENV.SLACK_CLIENT_ID && ENV.SLACK_CLIENT_SECRET && ENV.SLACK_SIGNING_SECRET);
    }

    public link_start(link_token: string) {
        const params = new URLSearchParams({
            client_id: ENV.SLACK_CLIENT_ID!,
            scope: BOT_SCOPES,
            state: link_token,
            redirect_uri: this.redirect_uri(),
        });

        return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
    }

    public async link_complete(payload: unknown): Promise<LinkedIdentity | null> {
        const { code, state } = payload as { code?: string; state?: string };
        if (!code || !state) return null;

        const response = await fetch(`${API_BASE}/oauth.v2.access`, {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: ENV.SLACK_CLIENT_ID!,
                client_secret: ENV.SLACK_CLIENT_SECRET!,
                code,
                redirect_uri: this.redirect_uri(),
            }),
        });

        const grant = (await response.json()) as SlackOAuthResponse;
        if (!grant.ok) throw new Error(`slack oauth failed: ${grant.error ?? "unknown error"}`);

        const channel = await this.open_dm(grant.access_token, grant.authed_user.id);

        return {
            linkToken: state,
            externalUserId: grant.authed_user.id,
            externalChatId: channel,
            credential: grant.access_token,
        };
    }

    public verify_request(req: Request) {
        if (!ENV.SLACK_SIGNING_SECRET) return false;

        const timestamp = req.headers["x-slack-request-timestamp"];
        const signature = req.headers["x-slack-signature"];
        if (typeof timestamp !== "string" || typeof signature !== "string") return false;

        const age = Math.abs(Date.now() / 1000 - Number(timestamp));
        if (!Number.isFinite(age) || age > MAX_SIGNATURE_AGE_SECONDS) return false;

        const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
        const base = `${SIGNATURE_VERSION}:${timestamp}:${raw.toString("utf8")}`;
        const digest = createHmac("sha256", ENV.SLACK_SIGNING_SECRET).update(base).digest("hex");
        const expected = Buffer.from(`${SIGNATURE_VERSION}=${digest}`, "utf8");
        const received = Buffer.from(signature, "utf8");

        if (expected.length !== received.length) return false;
        return timingSafeEqual(expected, received);
    }

    public async send_question(target: DeliveryTarget, question: OutboundQuestion) {
        const posted = await this.call<{ ts: string }>(target.credential, "chat.postMessage", {
            channel: target.externalChatId,
            text: `${question.key}: ${question.prompt}`,
            blocks: this.blocks_for(question),
        });

        return posted.ts;
    }

    public async send_notice(target: DeliveryTarget, text: string) {
        await this.call(target.credential, "chat.postMessage", {
            channel: target.externalChatId,
            text,
        });
    }

    public parse_reply(payload: unknown): ParsedReply | null {
        const interaction = payload as SlackBlockAction;
        if (interaction.type === "block_actions") {
            const action = interaction.actions?.[0];
            const value = action?.value ?? action?.selected_option?.value;
            const message_ts = interaction.message?.ts ?? interaction.container?.message_ts;
            if (!value || !message_ts) return null;

            return {
                externalUserId: interaction.user.id,
                externalMessageId: message_ts,
                value,
            };
        }

        const callback = payload as SlackEventCallback;
        const event = callback.event;
        if (callback.type === "event_callback" && event?.type === "message") {
            if (event.bot_id || !event.user || !event.text || !event.thread_ts) return null;

            return {
                externalUserId: event.user,
                externalMessageId: event.thread_ts,
                value: event.text,
            };
        }

        return null;
    }

    public async supersede(target: DeliveryTarget, external_message_id: string, reason: string) {
        await this.call(target.credential, "chat.update", {
            channel: target.externalChatId,
            ts: external_message_id,
            text: reason,
            blocks: [
                {
                    type: "context",
                    elements: [{ type: "mrkdwn", text: `_${reason}_` }],
                },
            ],
        });
    }

    private blocks_for(question: OutboundQuestion) {
        const blocks: Record<string, unknown>[] = [
            {
                type: "section",
                text: { type: "mrkdwn", text: `*${question.key}*\n${question.prompt}` },
            },
        ];

        if (question.secretUrl) {
            blocks.push({
                type: "actions",
                elements: [
                    {
                        type: "button",
                        style: "primary",
                        text: { type: "plain_text", text: "Provide securely" },
                        url: question.secretUrl,
                    },
                ],
            });
            blocks.push({
                type: "context",
                elements: [{ type: "mrkdwn", text: "_Never post a secret in this channel._" }],
            });

            return blocks;
        }

        const options = this.options_for(question);
        if (options.length > 0) {
            blocks.push({
                type: "actions",
                elements: options.map((option) => ({
                    type: "button",
                    text: { type: "plain_text", text: option },
                    value: option,
                    action_id: `answer_${option}`.slice(0, 255),
                })),
            });
        } else {
            blocks.push({
                type: "context",
                elements: [{ type: "mrkdwn", text: "_Reply in this thread to answer._" }],
            });
        }

        return blocks;
    }

    private options_for(question: OutboundQuestion) {
        if (!BUTTON_TYPES.has(question.type)) return [];
        if (question.options.length > 0) return question.options;
        return question.type === AgentQuestionType.NeedChoice ? [] : ["Approve", "Reject"];
    }

    private redirect_uri() {
        return `${ENV.PUBLIC_API_URL}/api/v1/connectors/slack/callback`;
    }

    private async open_dm(token: string, user_id: string) {
        const channel = await this.call<{ channel: { id: string } }>(token, "conversations.open", {
            users: user_id,
        });

        return channel.channel.id;
    }

    private async call<T>(
        token: string | null,
        method: string,
        body: Record<string, unknown>,
    ): Promise<T> {
        if (!token) throw new Error(`slack ${method} failed: missing bot token`);

        const response = await fetch(`${API_BASE}/${method}`, {
            method: "POST",
            headers: {
                authorization: `Bearer ${token}`,
                "content-type": "application/json; charset=utf-8",
            },
            body: JSON.stringify(body),
        });

        const payload = (await response.json()) as { ok: boolean; error?: string } & T;
        if (!payload.ok) {
            throw new Error(`slack ${method} failed: ${payload.error ?? "unknown error"}`);
        }

        return payload;
    }
}

const slack_connector = new SlackConnector();
register_connector(slack_connector);

export default slack_connector;
