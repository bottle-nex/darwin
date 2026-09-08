import { ENV } from "../../configs/env";
import type {
    ChatMessage,
    CompletedToolCall,
    StreamTurn,
    StreamUsage,
    ToolDefinition,
} from "./darwin.types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

type ChunkChoice = {
    delta?: {
        content?: string | null;
        tool_calls?: {
            index: number;
            id?: string;
            function?: { name?: string; arguments?: string };
        }[];
    };
    finish_reason?: string | null;
};

type Chunk = {
    choices?: ChunkChoice[];
    usage?: { prompt_tokens: number; completion_tokens: number };
    error?: { message?: string; code?: number };
};

export type OpenRouterErrorCode =
    "DARWIN_PROVIDER_UNAVAILABLE" | "DARWIN_UPSTREAM_ERROR" | "DARWIN_TIMEOUT";

/**
 * A model call that produced no usable turn. `code` is the domain code the UI branches on, so a
 * pinned provider being down reads as "the provider is down" rather than "something went wrong".
 */
export class OpenRouterError extends Error {
    constructor(
        readonly code: OpenRouterErrorCode,
        readonly status: number,
        message: string,
    ) {
        super(message);
        this.name = "OpenRouterError";
    }
}

/**
 * Streaming chat-completions client for OpenRouter.
 *
 * Hand-rolled on `fetch` rather than the `openai` package so OpenRouter's own `provider` and
 * `usage` fields stay typed — provider pinning is the setting we least want unchecked.
 *
 * @example
 * const turn = await OpenRouterClient.stream({
 *     messages, tools, signal, on_token: (text) => emit({ type: "token", text }),
 * });
 * // turn.toolCalls -> [{ id: "call_1", function: { name: "find_issues", arguments: "{...}" } }]
 */
export default class OpenRouterClient {
    /**
     * Run one streamed model turn.
     *
     * Aborts on whichever comes first: the caller's `signal`, or `SERVER_DARWIN_TIMEOUT_MS`.
     *
     * @throws {OpenRouterError} On a non-2xx response, a timeout, or a mid-stream provider error.
     * With `SERVER_DARWIN_ALLOW_FALLBACKS=false` a narrow quantization list 404s when no provider
     * matches, which surfaces as `DARWIN_PROVIDER_UNAVAILABLE`.
     */
    static async stream(options: {
        messages: ChatMessage[];
        tools: ToolDefinition[];
        signal: AbortSignal;
        on_token: (text: string) => void;
    }): Promise<StreamTurn> {
        const signal = AbortSignal.any([
            options.signal,
            AbortSignal.timeout(ENV.SERVER_DARWIN_TIMEOUT_MS),
        ]);

        let response: Response;
        try {
            response = await fetch(OPENROUTER_URL, {
                method: "POST",
                signal,
                headers: {
                    Authorization: `Bearer ${ENV.SERVER_OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": ENV.SERVER_WEB_URL,
                    // ASCII only: header values are Latin-1, so an em dash here throws before
                    // the request is even sent.
                    "X-Title": "darwin Ask Darwin",
                },
                body: JSON.stringify({
                    model: ENV.SERVER_DARWIN_MODEL,
                    messages: options.messages,
                    tools: options.tools,
                    tool_choice: "auto",
                    parallel_tool_calls: true,
                    stream: true,
                    temperature: 0.2,
                    max_tokens: ENV.SERVER_DARWIN_MAX_TOKENS,
                    usage: { include: true },
                    provider: {
                        quantizations: ENV.SERVER_DARWIN_QUANTIZATIONS,
                        allow_fallbacks: ENV.SERVER_DARWIN_ALLOW_FALLBACKS,
                    },
                }),
            });
        } catch (error) {
            if (options.signal.aborted) throw error;
            // Only an aborted timeout signal is actually a timeout. Everything else — a bad header
            // value, DNS, TLS — must keep its own message, or a five-second local failure gets
            // reported as "the provider is slow" and the real cause is lost.
            const cause = error as Error;
            if (cause.name === "TimeoutError") {
                throw new OpenRouterError(
                    "DARWIN_TIMEOUT",
                    504,
                    "OpenRouter did not respond in time",
                );
            }
            throw new OpenRouterError(
                "DARWIN_UPSTREAM_ERROR",
                502,
                `Could not reach OpenRouter: ${cause.message}`,
            );
        }

        if (!response.ok || !response.body) {
            const detail = await response.text().catch(() => "");
            throw new OpenRouterError(
                response.status === 404 ? "DARWIN_PROVIDER_UNAVAILABLE" : "DARWIN_UPSTREAM_ERROR",
                response.status,
                detail.slice(0, 500),
            );
        }

        return OpenRouterClient.decode(response.body, options.on_token);
    }

    /**
     * Decode the SSE body into one turn.
     *
     * Tool calls are accumulated into a map keyed by `delta.tool_calls[].index`: a provider may
     * send one call's name in an early chunk and split its `arguments` across dozens more, and it
     * interleaves parallel calls. Concatenating in arrival order produces one corrupt call.
     */
    private static async decode(
        body: ReadableStream<Uint8Array>,
        on_token: (text: string) => void,
    ): Promise<StreamTurn> {
        const reader = body.getReader();
        const decoder = new TextDecoder();
        const calls = new Map<number, { id: string; name: string; arguments: string }>();
        let buffer = "";
        let content = "";
        let finish_reason: string | null = null;
        let usage: StreamUsage | null = null;
        let finished = false;

        while (!finished) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let newline = buffer.indexOf("\n");
            while (newline !== -1) {
                const line = buffer.slice(0, newline).trimEnd();
                buffer = buffer.slice(newline + 1);
                newline = buffer.indexOf("\n");

                // `: OPENROUTER PROCESSING` keepalives arrive while a cold provider spins up.
                if (!line || line.startsWith(":") || !line.startsWith("data:")) continue;

                const payload = line.slice(5).trim();
                if (payload === "[DONE]") {
                    finished = true;
                    break;
                }

                let chunk: Chunk;
                try {
                    chunk = JSON.parse(payload) as Chunk;
                } catch {
                    continue;
                }

                if (chunk.error) {
                    throw new OpenRouterError(
                        "DARWIN_UPSTREAM_ERROR",
                        chunk.error.code ?? 502,
                        chunk.error.message ?? "OpenRouter stream error",
                    );
                }

                // Usage rides a trailing chunk whose `choices` is empty, so read it first.
                if (chunk.usage) {
                    usage = {
                        promptTokens: chunk.usage.prompt_tokens,
                        completionTokens: chunk.usage.completion_tokens,
                    };
                }

                const choice = chunk.choices?.[0];
                if (!choice) continue;
                if (choice.finish_reason) finish_reason = choice.finish_reason;

                const text = choice.delta?.content;
                if (text) {
                    content += text;
                    on_token(text);
                }

                for (const delta of choice.delta?.tool_calls ?? []) {
                    const call = calls.get(delta.index) ?? { id: "", name: "", arguments: "" };
                    if (delta.id) call.id = delta.id;
                    if (delta.function?.name) call.name = delta.function.name;
                    if (delta.function?.arguments) call.arguments += delta.function.arguments;
                    calls.set(delta.index, call);
                }
            }
        }

        const toolCalls: CompletedToolCall[] = [...calls.entries()]
            .sort(([left], [right]) => left - right)
            .map(([, call]) => ({
                id: call.id,
                type: "function" as const,
                function: { name: call.name, arguments: call.arguments },
            }));

        return { content, toolCalls, finishReason: finish_reason, usage };
    }
}
