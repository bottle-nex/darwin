import { Permissions } from "@trydarwin/access-control";
import type { DarwinEventBody, DarwinResource } from "@trydarwin/types";

import { ENV } from "../../configs/env";
import type { ChatMessage, CompletedToolCall, StreamUsage } from "./darwin.types";
import OpenRouterClient from "./service.openrouter";
import DarwinToolRegistry from "./tools";
import { type DarwinContext, DarwinToolError } from "./tools/tool.registry";
import { trim_tool_result } from "./tools/tool.trim";

/** An event before the stream layer stamps it with a sequence number. */
export type DarwinAgentEvent = DarwinEventBody;

export type DarwinRunResult = {
    text: string;
    iterations: number;
    /** The assistant and tool messages this run produced, ready to persist in order. */
    messages: ChatMessage[];
    /** What each call produced for the browser, by call id — persisted so a reload redraws it. */
    resources: Map<string, DarwinResource>;
    usage: StreamUsage;
};

/** What the loop hands each tool execution: how to speak, and where to leave a card behind. */
type RunHooks = {
    ctx: DarwinContext;
    emit: (event: DarwinAgentEvent) => void;
    collect: (callId: string, resource: DarwinResource) => void;
    defer: (callId: string, resource: DarwinResource) => void;
};

const STEP_CAP_REPLY =
    "I ran out of steps before I could finish that. Try asking about one lane or one issue at a time.";

const GENERIC_TOOL_FAILURE = "That did not work. Try another way, or tell the user it failed.";

/**
 * A card past this is a design bug rather than a big answer.
 *
 * Each one is persisted and replayed through a byte-capped buffer, so an oversized card is dropped
 * whole — a missing card costs nothing, a half-serialised one renders as a broken row.
 */
const MAX_RESOURCE_BYTES = 32_000;

/**
 * The tool-calling loop behind Ask Darwin.
 *
 * Streams a model turn, runs whatever tools it asked for, appends the results and goes again, up
 * to `SERVER_DARWIN_MAX_ITERATIONS`. Nothing a tool does throws out of the loop: a bad argument,
 * a missing permission or a handler blowing up all become `tool` messages the model reads and
 * recovers from. That is the difference between "Darwin says the column id was wrong" and a 500.
 *
 * @example
 * const result = await DarwinAgent.run({ ctx, messages, signal, emit });
 * // result.text -> "You have two open issues…"
 */
export default class DarwinAgent {
    static async run(options: {
        ctx: DarwinContext;
        messages: ChatMessage[];
        signal: AbortSignal;
        emit: (event: DarwinAgentEvent) => void;
    }): Promise<DarwinRunResult> {
        const tools = DarwinToolRegistry.definitions();
        const conversation: ChatMessage[] = [...options.messages];
        const produced: ChatMessage[] = [];
        const resources = new Map<string, DarwinResource>();
        const usage: StreamUsage = { promptTokens: 0, completionTokens: 0 };
        let deferred: { callId: string; resource: DarwinResource } | null = null;
        const hooks: RunHooks = {
            ctx: options.ctx,
            emit: options.emit,
            collect: (callId, resource) => resources.set(callId, resource),
            defer: (callId, resource) => {
                deferred = { callId, resource };
            },
        };

        /** A held-back card is drawn only when the run produced nothing else worth showing. */
        const flush_deferred = () => {
            const held = deferred as { callId: string; resource: DarwinResource } | null;
            if (!held || resources.size) return;
            options.emit({ type: "resource", callId: held.callId, resource: held.resource });
            resources.set(held.callId, held.resource);
        };
        let answer = "";

        for (let iteration = 1; iteration <= ENV.SERVER_DARWIN_MAX_ITERATIONS; iteration++) {
            options.signal.throwIfAborted();

            const turn = await OpenRouterClient.stream({
                messages: conversation,
                tools,
                signal: options.signal,
                on_token: (text) => options.emit({ type: "token", text }),
            });

            if (turn.usage) {
                usage.promptTokens += turn.usage.promptTokens;
                usage.completionTokens += turn.usage.completionTokens;
            }

            const assistant: ChatMessage = {
                role: "assistant",
                content: turn.content.length ? turn.content : null,
                ...(turn.toolCalls.length ? { tool_calls: turn.toolCalls } : {}),
            };
            conversation.push(assistant);
            produced.push(assistant);
            answer += turn.content;

            if (!turn.toolCalls.length) {
                flush_deferred();
                return {
                    text: answer,
                    iterations: iteration,
                    messages: produced,
                    resources,
                    usage,
                };
            }

            const results = await DarwinAgent.execute_all(turn.toolCalls, hooks);
            conversation.push(...results);
            produced.push(...results);
        }

        flush_deferred();
        return {
            text: answer.length ? answer : STEP_CAP_REPLY,
            iterations: ENV.SERVER_DARWIN_MAX_ITERATIONS,
            messages: produced,
            resources,
            usage,
        };
    }

    /**
     * Run one turn's tool calls and return their `tool` messages in request order.
     *
     * Read-only batches fan out; a batch containing any write runs sequentially so two edits to
     * the same issue cannot interleave. Order is preserved either way — an assistant message with
     * N `tool_calls` must be followed by exactly N `tool` messages, and providers reject a
     * mismatch with a 400 rather than a degraded answer.
     */
    private static async execute_all(
        calls: CompletedToolCall[],
        options: RunHooks,
    ): Promise<ChatMessage[]> {
        const parallel = calls.every(
            (call) => DarwinToolRegistry.get(call.function.name)?.readOnly === true,
        );

        if (parallel) {
            return Promise.all(calls.map((call) => DarwinAgent.execute(call, options)));
        }

        const results: ChatMessage[] = [];
        for (const call of calls) {
            results.push(await DarwinAgent.execute(call, options));
        }
        return results;
    }

    /**
     * Execute one tool call, turning every possible failure into a readable `tool` message.
     *
     * Five failure modes, each fed back rather than thrown: an unknown tool name, `arguments`
     * that is not valid JSON, arguments that fail validation, a role that lacks the tool's
     * action, and a handler that throws. Zod's issues are passed through close to verbatim,
     * because a model told "priority: expected number, received string" fixes itself next round.
     */
    private static async execute(call: CompletedToolCall, options: RunHooks): Promise<ChatMessage> {
        const tool = DarwinToolRegistry.get(call.function.name);
        if (!tool) {
            // Deliberately does not name what does exist: the model is told to relay refusals,
            // and an inventory quoted back to the user is exactly what it must not say.
            return DarwinAgent.tool_message(call, {
                error: "That is not something you can do. Tell the user you cannot do it.",
            });
        }

        if (!Permissions.project(options.ctx.role, tool.action)) {
            // Generic on purpose: the tool's own name would read as jargon to the user, and the
            // model is told to relay refusals.
            return DarwinAgent.tool_message(call, {
                error: "You do not have permission to do that in this project.",
            });
        }

        let raw: unknown;
        try {
            raw = call.function.arguments.trim().length ? JSON.parse(call.function.arguments) : {};
        } catch {
            return DarwinAgent.tool_message(call, {
                error: "`arguments` was not valid JSON. Send a single JSON object.",
            });
        }

        const parsed = tool.input.safeParse(raw);
        if (!parsed.success) {
            return DarwinAgent.tool_message(call, {
                error: "Invalid arguments.",
                issues: parsed.error.issues.map((issue) => ({
                    path: issue.path.join(".") || "(root)",
                    message: issue.message,
                })),
            });
        }

        options.emit({ type: "tool", callId: call.id, name: tool.name, state: "running" });

        try {
            const { output, resource } = await tool.run(parsed.data, options.ctx);
            options.emit({ type: "tool", callId: call.id, name: tool.name, state: "ok" });

            // Drawn in its own try/catch because the write already happened: a mapping slip here
            // must cost a card, never turn a successful write into a failure the model retries.
            const card = DarwinAgent.draw(tool.name, resource);
            if (card && tool.fallbackCard) {
                options.defer(call.id, card);
            } else if (card) {
                options.emit({ type: "resource", callId: call.id, resource: card });
                options.collect(call.id, card);
            }
            // Only `output` reaches the model — the resource is for the browser and would be dead
            // weight in a context that resends every tool result on each later iteration.
            return DarwinAgent.tool_message(call, trim_tool_result(output));
        } catch (error) {
            if (!(error instanceof DarwinToolError)) {
                console.error(`[darwin] tool ${tool.name} threw`, error);
            }
            options.emit({ type: "tool", callId: call.id, name: tool.name, state: "error" });
            return DarwinAgent.tool_message(call, {
                error: error instanceof DarwinToolError ? error.message : GENERIC_TOOL_FAILURE,
            });
        }
    }

    private static draw(
        name: string,
        build: (() => DarwinResource) | undefined,
    ): DarwinResource | null {
        if (!build) return null;
        try {
            const resource = build();
            const size = JSON.stringify(resource).length;
            if (size <= MAX_RESOURCE_BYTES) return resource;
            console.warn(`[darwin] dropped a ${resource.kind} card at ${size} bytes`);
        } catch (error) {
            console.error(`[darwin] could not draw the card for ${name}`, error);
        }
        return null;
    }

    private static tool_message(call: CompletedToolCall, payload: unknown): ChatMessage {
        return {
            role: "tool",
            tool_call_id: call.id,
            name: call.function.name,
            content: JSON.stringify(payload),
        };
    }
}
