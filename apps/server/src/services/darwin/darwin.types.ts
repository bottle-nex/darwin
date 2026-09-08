/**
 * One tool call the model asked for, reassembled from its streamed fragments.
 * `arguments` is a JSON *string*, not an object — that is the OpenAI wire format.
 */
export type CompletedToolCall = {
    id: string;
    type: "function";
    function: { name: string; arguments: string };
};

/**
 * A message in the shape OpenAI-compatible providers expect.
 *
 * An assistant turn carrying `tool_calls` must be followed by exactly one `tool` message per
 * call, in order — providers reject a mismatch outright, which is why history is never sliced
 * between the two.
 */
export type ChatMessage =
    | { role: "system"; content: string }
    | { role: "user"; content: string }
    | { role: "assistant"; content: string | null; tool_calls?: CompletedToolCall[] }
    | { role: "tool"; tool_call_id: string; name: string; content: string };

/** A tool advertised to the model. `parameters` is JSON Schema built from the tool's zod schema. */
export type ToolDefinition = {
    type: "function";
    function: { name: string; description: string; parameters: Record<string, unknown> };
};

export type StreamUsage = {
    promptTokens: number;
    completionTokens: number;
};

/** What one streamed model turn produced. Either `content` is the answer, or `toolCalls` is the ask. */
export type StreamTurn = {
    content: string;
    toolCalls: CompletedToolCall[];
    finishReason: string | null;
    usage: StreamUsage | null;
};
