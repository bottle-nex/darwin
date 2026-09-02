import { AgentQuestionType, Provider } from "@trymatcha/database";
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

const API_BASE = "https://api.telegram.org/bot";

type TelegramUser = { id: number };
type TelegramChat = { id: number };

type TelegramMessage = {
    message_id: number;
    from?: TelegramUser;
    chat: TelegramChat;
    text?: string;
    reply_to_message?: { message_id: number };
};

type TelegramUpdate = {
    message?: TelegramMessage;
    callback_query?: {
        id: string;
        from: TelegramUser;
        data?: string;
        message?: TelegramMessage;
    };
};

const KEYBOARD_TYPES = new Set<AgentQuestionType>([
    AgentQuestionType.NeedChoice,
    AgentQuestionType.Confirm,
    AgentQuestionType.ApproveCost,
]);

class TelegramConnector implements ConnectorAdapter {
    public readonly provider = Provider.Telegram;

    public is_configured() {
        return Boolean(ENV.TELEGRAM_BOT_TOKEN && ENV.TELEGRAM_BOT_USERNAME);
    }

    public link_start(link_token: string) {
        return `https://t.me/${ENV.TELEGRAM_BOT_USERNAME}?start=${link_token}`;
    }

    public async link_complete(payload: unknown): Promise<LinkedIdentity | null> {
        const update = payload as TelegramUpdate;
        const message = update.message;
        if (!message?.from || !message.text) return null;

        const match = message.text.match(/^\/start\s+(\S+)$/);
        if (!match) return null;

        return {
            linkToken: match[1],
            externalUserId: String(message.from.id),
            externalChatId: String(message.chat.id),
            credential: null,
        };
    }

    public verify_request(req: Request) {
        if (!ENV.TELEGRAM_WEBHOOK_SECRET) return false;
        return req.headers["x-telegram-bot-api-secret-token"] === ENV.TELEGRAM_WEBHOOK_SECRET;
    }

    public async send_question(target: DeliveryTarget, question: OutboundQuestion) {
        const body: Record<string, unknown> = {
            chat_id: target.externalChatId,
            text: this.render(question),
            parse_mode: "HTML",
        };

        const keyboard = this.keyboard_for(question);
        if (keyboard) body.reply_markup = { inline_keyboard: keyboard };
        else body.reply_markup = { force_reply: true };

        const message = await this.call<TelegramMessage>("sendMessage", body);
        return String(message.message_id);
    }

    public parse_reply(payload: unknown): ParsedReply | null {
        const update = payload as TelegramUpdate;

        const callback = update.callback_query;
        if (callback?.data && callback.message) {
            return {
                externalUserId: String(callback.from.id),
                externalMessageId: String(callback.message.message_id),
                value: callback.data,
            };
        }

        const message = update.message;
        if (message?.from && message.text && message.reply_to_message) {
            return {
                externalUserId: String(message.from.id),
                externalMessageId: String(message.reply_to_message.message_id),
                value: message.text,
            };
        }

        return null;
    }

    public async supersede(target: DeliveryTarget, external_message_id: string, reason: string) {
        await this.call("editMessageReplyMarkup", {
            chat_id: target.externalChatId,
            message_id: Number(external_message_id),
            reply_markup: { inline_keyboard: [] },
        });

        await this.call("sendMessage", {
            chat_id: target.externalChatId,
            reply_to_message_id: Number(external_message_id),
            text: `<i>${this.escape(reason)}</i>`,
            parse_mode: "HTML",
        });
    }

    public async send_linked_confirmation(external_chat_id: string) {
        await this.call("sendMessage", {
            chat_id: external_chat_id,
            text: "matcha is connected. Agent questions will arrive here.",
        });
    }

    public async acknowledge(callback_query_id: string) {
        await this.call("answerCallbackQuery", { callback_query_id });
    }

    public async register_webhook() {
        if (!this.is_configured() || !ENV.TELEGRAM_WEBHOOK_SECRET) return;

        await this.call("setWebhook", {
            url: `${ENV.PUBLIC_API_URL}/api/v1/connectors/telegram/webhook`,
            secret_token: ENV.TELEGRAM_WEBHOOK_SECRET,
            allowed_updates: ["message", "callback_query"],
        });
    }

    private render(question: OutboundQuestion) {
        const lines = [`<b>${this.escape(question.key)}</b>`, this.escape(question.prompt)];

        if (question.secretUrl) {
            lines.push("", `🔐 <a href="${question.secretUrl}">Provide it securely</a>`);
            lines.push("<i>Never send a secret in this chat.</i>");
        } else if (!KEYBOARD_TYPES.has(question.type) && question.options.length > 0) {
            lines.push("", ...question.options.map((option) => `• ${this.escape(option)}`));
        }

        return lines.join("\n");
    }

    private keyboard_for(question: OutboundQuestion) {
        if (question.secretUrl) return null;
        if (!KEYBOARD_TYPES.has(question.type)) return null;

        const options =
            question.options.length > 0
                ? question.options
                : question.type === AgentQuestionType.NeedChoice
                  ? []
                  : ["Approve", "Reject"];

        if (options.length === 0) return null;

        return options.map((option) => [{ text: option, callback_data: option }]);
    }

    private escape(value: string) {
        return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    private async call<T>(method: string, body: Record<string, unknown>): Promise<T> {
        const response = await fetch(`${API_BASE}${ENV.TELEGRAM_BOT_TOKEN}/${method}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
        });

        const payload = (await response.json()) as { ok: boolean; result: T; description?: string };
        if (!payload.ok) {
            throw new Error(`telegram ${method} failed: ${payload.description ?? "unknown error"}`);
        }

        return payload.result;
    }
}

const telegram_connector = new TelegramConnector();
register_connector(telegram_connector);

export default telegram_connector;
