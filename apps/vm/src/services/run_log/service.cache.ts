import {
    OutboundSocketMessageType,
    project_channel_name,
    RUN_LOG_CACHE_INDEX_KEY,
    run_log_cache_key,
    run_log_event_bytes,
    RUN_LOG_HOT_TTL_SECONDS,
    RUN_LOG_MAX_BYTES,
    run_log_meta_key,
    type RunLogEvent,
} from "@trydarwin/types";

import { redis } from "../platform/service.redis";

export type RunLogOwner = { projectId: string; issueId: string };

export type RunLogAppendResult = "stored" | "duplicate" | "refused";

/**
 * How far ahead of the last stored event a sandbox may jump in one step.
 *
 * Sequence numbers are assigned inside the sandbox so a retry can carry the identity of the
 * event it replaces, which means a broken one could claim a number far in the future and starve
 * everything after it. The bound keeps that damage to a stall this check can report.
 */
const SEQ_LOOKAHEAD_LIMIT = 10_000;

/**
 * Writes one event into the shared cache and announces it on the project channel.
 *
 * The vm worker holds this rather than the API server because it is the only process with the
 * sandbox in hand, and it is never reachable by a browser: the live feed leaves here as a
 * pub/sub message that the socket server relays, so no end-user connection reaches the worker.
 */
export default class RunLogCache {
    static async append(
        run_id: string,
        owner: RunLogOwner,
        event: RunLogEvent,
    ): Promise<RunLogAppendResult> {
        const client = redis();
        const cache_key = run_log_cache_key(run_id);
        const meta_key = run_log_meta_key(run_id);

        const [last_seq, bytes] = await client.hmget(meta_key, "seq", "bytes");
        const highest_seq = Number(last_seq ?? 0);
        const total_bytes = Number(bytes ?? 0);

        if (event.seq <= highest_seq) return "duplicate";
        if (event.seq > highest_seq + SEQ_LOOKAHEAD_LIMIT) return "refused";

        if (total_bytes >= RUN_LOG_MAX_BYTES) {
            await client.hincrby(meta_key, "dropped", 1);
            return "refused";
        }

        await client
            .multi()
            .zadd(cache_key, event.seq, JSON.stringify(event))
            .hset(meta_key, {
                projectId: owner.projectId,
                issueId: owner.issueId,
                seq: event.seq,
                bytes: total_bytes + run_log_event_bytes(event),
            })
            .hincrby(meta_key, "received", 1)
            .sadd(RUN_LOG_CACHE_INDEX_KEY, run_id)
            .expire(cache_key, RUN_LOG_HOT_TTL_SECONDS)
            .expire(meta_key, RUN_LOG_HOT_TTL_SECONDS)
            .exec();

        await client.publish(
            project_channel_name(owner.projectId),
            JSON.stringify({
                type: OutboundSocketMessageType.RUN_LOG_APPENDED,
                projectId: owner.projectId,
                runId: run_id,
                payload: { events: [event], cursor: event.seq },
            }),
        );

        return "stored";
    }

    /**
     * Rewrites an event already stored under `seq`, and announces it again.
     *
     * Both sides describe the same command — the worker sees the harness run it, and the agent
     * reports it afterwards with a title a person can read. The trace always lands first, so the
     * richer report has to be able to overwrite it rather than be dropped as a repeat. Readers
     * key events by sequence, so re-publishing the same number replaces rather than appends.
     */
    static async replace(run_id: string, owner: RunLogOwner, event: RunLogEvent): Promise<void> {
        const client = redis();
        const cache_key = run_log_cache_key(run_id);

        await client
            .multi()
            .zremrangebyscore(cache_key, event.seq, event.seq)
            .zadd(cache_key, event.seq, JSON.stringify(event))
            .hincrby(run_log_meta_key(run_id), "bytes", run_log_event_bytes(event))
            .exec();

        await client.publish(
            project_channel_name(owner.projectId),
            JSON.stringify({
                type: OutboundSocketMessageType.RUN_LOG_APPENDED,
                projectId: owner.projectId,
                runId: run_id,
                payload: { events: [event], cursor: event.seq },
            }),
        );
    }
}
