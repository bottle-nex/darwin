import {
    type DarwinMessage,
    DarwinRole,
    type DarwinRun,
    DarwinRunStatus,
    type DarwinThread,
    DarwinToolStatus,
    type Prisma,
    prisma,
} from "@trydarwin/database";
import type {
    DarwinResource,
    DarwinThreadDetail,
    DarwinThreadSummary,
    DarwinToolStep,
    DarwinUiMessage,
} from "@trydarwin/types";

import { ENV } from "../../configs/env";
import type { ChatMessage, CompletedToolCall, StreamUsage } from "./darwin.types";

const TITLE_MAX_LENGTH = 60;

const ROLE_OF: Record<ChatMessage["role"], DarwinRole> = {
    system: DarwinRole.System,
    user: DarwinRole.User,
    assistant: DarwinRole.Assistant,
    tool: DarwinRole.Tool,
};

function to_chat_message(row: {
    role: DarwinRole;
    content: string | null;
    toolCalls: Prisma.JsonValue;
    toolCallId: string | null;
    name: string | null;
}): ChatMessage | null {
    if (row.role === DarwinRole.User) return { role: "user", content: row.content ?? "" };
    if (row.role === DarwinRole.Assistant) {
        const calls = (row.toolCalls as CompletedToolCall[] | null) ?? undefined;
        return {
            role: "assistant",
            content: row.content,
            ...(calls?.length ? { tool_calls: calls } : {}),
        };
    }
    if (row.role === DarwinRole.Tool && row.toolCallId) {
        return {
            role: "tool",
            tool_call_id: row.toolCallId,
            name: row.name ?? "",
            content: row.content ?? "",
        };
    }
    return null;
}

/**
 * Storage for Ask Darwin conversations.
 *
 * Threads are per project *and* per user, so every lookup here is keyed by both — a thread id
 * alone is never enough to read one.
 *
 * @example
 * const thread = await DarwinThreadService.resolve({ threadId, projectId, userId, firstMessage });
 */
export default class DarwinThreadService {
    /** Fetch the caller's thread, or open a new one titled from their opening message. */
    static async resolve(input: {
        threadId?: string;
        projectId: string;
        userId: string;
        firstMessage: string;
    }): Promise<DarwinThread | null> {
        if (!input.threadId) {
            return prisma.darwinThread.create({
                data: {
                    projectId: input.projectId,
                    userId: input.userId,
                    title: input.firstMessage.trim().slice(0, TITLE_MAX_LENGTH),
                },
            });
        }

        return prisma.darwinThread.findFirst({
            where: { id: input.threadId, projectId: input.projectId, userId: input.userId },
        });
    }

    /**
     * Load the tail of a thread as model-ready messages.
     *
     * Walks backwards and only cuts at a User message. An assistant turn and its tool results are
     * indivisible — slicing between them leaves an orphaned `tool` message that OpenAI-compatible
     * providers reject outright, so a plain "last N rows" window would break the API.
     *
     * @example
     * await DarwinThreadService.window("cl9x…"); // [{ role: "user", … }, { role: "assistant", … }]
     */
    static async window(thread_id: string): Promise<ChatMessage[]> {
        const rows = await prisma.darwinMessage.findMany({
            where: { threadId: thread_id },
            orderBy: { seq: "desc" },
            take: ENV.SERVER_DARWIN_HISTORY_LIMIT * 6,
            select: { role: true, content: true, toolCalls: true, toolCallId: true, name: true },
        });

        const ordered = rows.reverse();
        let start = ordered.length;
        let user_turns = 0;
        for (let index = ordered.length - 1; index >= 0; index--) {
            if (ordered[index]!.role !== DarwinRole.User) continue;
            user_turns++;
            start = index;
            if (user_turns >= ENV.SERVER_DARWIN_HISTORY_LIMIT) break;
        }

        return ordered
            .slice(start === ordered.length ? 0 : start)
            .map(to_chat_message)
            .filter((message): message is ChatMessage => message !== null);
    }

    /** The caller's threads in this project, newest first. */
    static async list(project_id: string, user_id: string): Promise<DarwinThreadSummary[]> {
        const rows = await prisma.darwinThread.findMany({
            where: { projectId: project_id, userId: user_id },
            orderBy: { updatedAt: "desc" },
            take: 50,
            select: { id: true, title: true, updatedAt: true },
        });
        return rows.map((row) => ({
            id: row.id,
            title: row.title,
            updatedAt: row.updatedAt.toISOString(),
        }));
    }

    /**
     * Give a thread a name of the user's own.
     *
     * Titles start as the first line the user typed, which is a reasonable guess and often a bad
     * name. The same ownership filter as every other read is in the `where`, so a thread that is
     * not the caller's simply matches nothing rather than erroring differently.
     *
     * @example
     * await DarwinThreadService.rename(id, projectId, userId, "release blockers");
     * // { id: "cku…", title: "release blockers", updatedAt: "2026-09-08T…" }
     */
    static async rename(
        thread_id: string,
        project_id: string,
        user_id: string,
        title: string,
    ): Promise<DarwinThreadSummary | null> {
        const result = await prisma.darwinThread.updateMany({
            where: { id: thread_id, projectId: project_id, userId: user_id },
            data: { title: title.trim().slice(0, TITLE_MAX_LENGTH) },
        });
        if (!result.count) return null;

        const row = await prisma.darwinThread.findUnique({
            where: { id: thread_id },
            select: { id: true, title: true, updatedAt: true },
        });
        return row
            ? { id: row.id, title: row.title, updatedAt: row.updatedAt.toISOString() }
            : null;
    }

    /**
     * Delete a thread and everything it holds.
     *
     * Messages, runs and tool calls go with it by cascade, so there is nothing to clean up here.
     * Returns false when the thread is not the caller's, which the controller reads as a 404.
     *
     * @example
     * await DarwinThreadService.remove(id, projectId, userId); // true
     */
    static async remove(thread_id: string, project_id: string, user_id: string): Promise<boolean> {
        const result = await prisma.darwinThread.deleteMany({
            where: { id: thread_id, projectId: project_id, userId: user_id },
        });
        return result.count > 0;
    }

    /**
     * One thread, in the shape the pane renders.
     *
     * Every assistant row of one run folds into a single turn, which is what the live stream
     * already produces. Without that the two disagree: a run that took eight loop iterations
     * persists eight assistant rows, seven of them with no prose, and a reloaded thread renders
     * seven empty messages where the live one rendered one answer.
     *
     * Tool rows are dropped — their content is JSON written for the model — but their steps and
     * whatever those steps produced survive. `activeRunId` is what a reloaded tab resubscribes to.
     */
    static async detail(
        thread_id: string,
        project_id: string,
        user_id: string,
    ): Promise<DarwinThreadDetail | null> {
        const thread = await prisma.darwinThread.findFirst({
            where: { id: thread_id, projectId: project_id, userId: user_id },
            select: {
                id: true,
                title: true,
                messages: {
                    orderBy: { seq: "asc" },
                    select: {
                        id: true,
                        seq: true,
                        runId: true,
                        role: true,
                        content: true,
                        toolCalls: true,
                        createdAt: true,
                        toolCallRows: { select: { callId: true, result: true } },
                    },
                },
                runs: {
                    where: { status: DarwinRunStatus.Streaming },
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    select: { id: true },
                },
            },
        });
        if (!thread) return null;

        const messages: DarwinUiMessage[] = [];
        for (const row of thread.messages) {
            if (row.role === DarwinRole.User) {
                messages.push({
                    id: row.id,
                    seq: row.seq,
                    role: "user",
                    content: row.content ?? "",
                    tools: [],
                    createdAt: row.createdAt.toISOString(),
                });
                continue;
            }
            if (row.role !== DarwinRole.Assistant) continue;

            const resources = new Map(
                row.toolCallRows.map((call) => [
                    call.callId,
                    (call.result ?? null) as DarwinResource | null,
                ]),
            );
            const steps: DarwinToolStep[] = (
                (row.toolCalls as CompletedToolCall[] | null) ?? []
            ).map((call) => ({
                callId: call.id,
                name: call.function.name,
                resource: resources.get(call.id) ?? null,
            }));

            // Fold into the open turn when this row belongs to the same run as the last one.
            const open = messages.at(-1);
            if (open?.role === "assistant" && row.runId && open.id === row.runId) {
                open.content = [open.content, row.content ?? ""].filter(Boolean).join("\n\n");
                open.tools.push(...steps);
                continue;
            }

            messages.push({
                // A turn is identified by its run, on both paths — the live fold keys the same way,
                // so a thread reloaded mid-answer does not end up with the turn twice.
                id: row.runId ?? row.id,
                seq: row.seq,
                role: "assistant",
                content: row.content ?? "",
                tools: steps,
                createdAt: row.createdAt.toISOString(),
            });
        }

        return {
            id: thread.id,
            title: thread.title,
            // A turn with neither prose nor a step never happened as far as the reader is concerned.
            messages: messages.filter(
                (message) => message.content.length > 0 || message.tools.length > 0,
            ),
            activeRunId: thread.runs[0]?.id ?? null,
        };
    }

    /** Open a run: the unit a client subscribes to and a cancel targets. */
    static start_run(thread_id: string): Promise<DarwinRun> {
        return prisma.darwinRun.create({
            data: { threadId: thread_id, model: ENV.SERVER_DARWIN_MODEL },
        });
    }

    /** Append the user's turn. */
    static async append_user(
        thread_id: string,
        run_id: string,
        text: string,
    ): Promise<DarwinMessage> {
        const seq = await DarwinThreadService.next_seq(thread_id);
        return prisma.darwinMessage.create({
            data: { threadId: thread_id, runId: run_id, seq, role: DarwinRole.User, content: text },
        });
    }

    /**
     * Persist everything one run produced, then close the run.
     *
     * Tool calls are written twice on purpose: once inside the assistant row's `toolCalls` column,
     * which is the wire format replayed to the model, and once as `DarwinToolCall` rows, which are
     * the queryable audit trail. Returns the id of the final assistant message so the `done` event
     * can point the browser at a real row.
     */
    static async finish_run(
        thread_id: string,
        run_id: string,
        result: {
            messages: ChatMessage[];
            iterations: number;
            usage: StreamUsage;
            resources: Map<string, DarwinResource>;
        },
    ): Promise<string | null> {
        let seq = await DarwinThreadService.next_seq(thread_id);
        let last_assistant_id: string | null = null;

        for (const message of result.messages) {
            const created = await prisma.darwinMessage.create({
                data: {
                    threadId: thread_id,
                    runId: run_id,
                    seq: seq++,
                    role: ROLE_OF[message.role],
                    content: message.role === "assistant" ? message.content : message.content,
                    toolCalls:
                        message.role === "assistant" && message.tool_calls
                            ? (message.tool_calls as unknown as Prisma.InputJsonValue)
                            : undefined,
                    toolCallId: message.role === "tool" ? message.tool_call_id : undefined,
                    name: message.role === "tool" ? message.name : undefined,
                },
                select: { id: true },
            });

            if (message.role === "assistant") {
                last_assistant_id = created.id;
                await DarwinThreadService.write_tool_calls(
                    thread_id,
                    created.id,
                    message.tool_calls,
                    result.resources,
                );
            }
        }

        await prisma.darwinRun.update({
            where: { id: run_id },
            data: {
                status: DarwinRunStatus.Done,
                iterations: result.iterations,
                promptTokens: result.usage.promptTokens,
                completionTokens: result.usage.completionTokens,
                completedAt: new Date(),
            },
        });
        await prisma.darwinThread.update({
            where: { id: thread_id },
            data: { updatedAt: new Date() },
        });

        return last_assistant_id;
    }

    static async close_run(run_id: string, status: DarwinRunStatus, error?: string) {
        await prisma.darwinRun.update({
            where: { id: run_id },
            data: { status, error, completedAt: new Date() },
        });
    }

    /**
     * The audit row per tool call, and where a card is kept.
     *
     * `result` holds what the browser draws, not what the model read — that is the one copy a
     * reloaded thread rebuilds its cards from, since the Redis replay buffer only lasts an hour.
     */
    private static async write_tool_calls(
        thread_id: string,
        message_id: string,
        calls: CompletedToolCall[] | undefined,
        resources: Map<string, DarwinResource>,
    ) {
        if (!calls?.length) return;
        await prisma.darwinToolCall.createMany({
            data: calls.map((call) => ({
                messageId: message_id,
                threadId: thread_id,
                callId: call.id,
                name: call.function.name,
                arguments: safe_json(call.function.arguments),
                result: (resources.get(call.id) ?? undefined) as Prisma.InputJsonValue | undefined,
                status: DarwinToolStatus.Ok,
            })),
        });
    }

    private static async next_seq(thread_id: string): Promise<number> {
        const last = await prisma.darwinMessage.findFirst({
            where: { threadId: thread_id },
            orderBy: { seq: "desc" },
            select: { seq: true },
        });
        return (last?.seq ?? 0) + 1;
    }
}

function safe_json(raw: string): Prisma.InputJsonValue {
    try {
        return JSON.parse(raw) as Prisma.InputJsonValue;
    } catch {
        return { raw };
    }
}
