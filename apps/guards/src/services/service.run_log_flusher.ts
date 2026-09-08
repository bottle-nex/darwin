import { gzipSync } from "node:zlib";

import { AgentSessionStatus, prisma } from "@trydarwin/database";
import Logger from "@trydarwin/logger";
import {
    OutboundSocketMessageType,
    project_channel_name,
    RUN_LOG_CACHE_INDEX_KEY,
    RunLog,
    type RunLogEvent,
} from "@trydarwin/types";

import { redis } from "./service.redis";
import StorageService from "./service.storage";

const log = Logger.scope("run-logs");

export const FLUSH_INTERVAL_MS = 15_000;
const SEGMENT_EVENT_LIMIT = 5_000;

type RunLogMeta = {
    projectId: string;
    flushed: number;
    segments: number;
    received: number;
    dropped: number;
    sizeBytes: number;
};

/**
 * Moves finished slices of a run's cache into object storage and drops them from Redis.
 *
 * Runs here rather than on the API server or the vm worker so the cost of compressing and
 * uploading every run's history lands on the process that has nothing else to serve.
 */
export default class RunLogFlusher {
    private static running = false;

    static async sweep(): Promise<void> {
        if (RunLogFlusher.running) return;
        if (!StorageService.is_run_logs_configured()) return;

        RunLogFlusher.running = true;
        try {
            const run_ids = await redis().smembers(RUN_LOG_CACHE_INDEX_KEY);
            for (const run_id of run_ids) {
                try {
                    await RunLogFlusher.flush_run(run_id);
                } catch (error) {
                    log.error("flush failed", { run: run_id, error });
                }
            }
        } catch (error) {
            log.error("sweep failed", error);
        } finally {
            RunLogFlusher.running = false;
        }
    }

    private static async read_meta(run_id: string): Promise<RunLogMeta | null> {
        const meta = await redis().hgetall(RunLog.meta_key(run_id));
        if (!meta.projectId) return null;
        return {
            projectId: meta.projectId,
            flushed: Number(meta.flushed ?? 0),
            segments: Number(meta.segments ?? 0),
            received: Number(meta.received ?? 0),
            dropped: Number(meta.dropped ?? 0),
            sizeBytes: Number(meta.sizeBytes ?? 0),
        };
    }

    private static async flush_run(run_id: string): Promise<void> {
        const client = redis();
        const meta = await RunLogFlusher.read_meta(run_id);
        if (!meta) {
            await client.srem(RUN_LOG_CACHE_INDEX_KEY, run_id);
            return;
        }

        const cache_key = RunLog.cache_key(run_id);
        const payloads = await client.zrangebyscore(
            cache_key,
            `(${meta.flushed}`,
            "+inf",
            "LIMIT",
            0,
            SEGMENT_EVENT_LIMIT,
        );

        let flushed_to = meta.flushed;
        if (payloads.length) {
            flushed_to = await RunLogFlusher.write_segment(run_id, meta, payloads);
        }

        const finished = await RunLogFlusher.is_finished(run_id);
        if (!finished) return;

        const remaining = await client.zcount(cache_key, `(${flushed_to}`, "+inf");
        if (remaining > 0) return;

        await RunLogFlusher.finalize(run_id, meta);
    }

    private static async write_segment(
        run_id: string,
        meta: RunLogMeta,
        payloads: string[],
    ): Promise<number> {
        const events = payloads
            .map((payload) => {
                try {
                    return JSON.parse(payload) as RunLogEvent;
                } catch {
                    return null;
                }
            })
            .filter((event): event is RunLogEvent => event !== null);

        if (!events.length) return meta.flushed;

        const first_seq = events[0]!.seq;
        const last_seq = events[events.length - 1]!.seq;
        const body = gzipSync(Buffer.from(payloads.join("\n")));

        await StorageService.put_run_log_segment(
            RunLog.segment_key(meta.projectId, run_id, first_seq),
            body,
        );

        const meta_key = RunLog.meta_key(run_id);
        await redis()
            .multi()
            .zremrangebyscore(RunLog.cache_key(run_id), "-inf", last_seq)
            .hset(meta_key, { flushed: last_seq })
            .hincrby(meta_key, "segments", 1)
            .hincrby(meta_key, "sizeBytes", body.length)
            .exec();

        log.info("segment archived", { run: run_id, events: events.length, bytes: body.length });
        return last_seq;
    }

    private static async is_finished(run_id: string): Promise<boolean> {
        const session = await prisma.agentSession.findUnique({
            where: { id: run_id },
            select: { status: true },
        });
        return Boolean(session) && session!.status !== AgentSessionStatus.Running;
    }

    /**
     * Joins the run's segments into the one object the read and download paths expect.
     *
     * Segments exist so a live run can be trimmed out of the cache as it goes; once it ends they
     * are just parts of one history, and leaving them apart would make every later read list and
     * fetch N objects to answer a question about a run that is never going to change again.
     */
    private static async combine_segments(
        run_id: string,
        meta: RunLogMeta,
    ): Promise<string | null> {
        const prefix = RunLog.prefix(meta.projectId, run_id);
        const keys = await StorageService.list_run_log_segments(prefix);
        if (!keys.length) return null;

        const parts: Buffer[] = [];
        for (const key of keys) {
            parts.push(await StorageService.read_run_log_segment(key));
        }

        const archive_key = RunLog.object_key(meta.projectId, run_id);
        await StorageService.put_run_log_segment(archive_key, Buffer.concat(parts));
        await StorageService.remove_run_log_segments(keys);
        return archive_key;
    }

    private static async finalize(run_id: string, meta: RunLogMeta): Promise<void> {
        const client = redis();
        const final = (await RunLogFlusher.read_meta(run_id)) ?? meta;
        const archive_key = await RunLogFlusher.combine_segments(run_id, final);

        await prisma.agentSession.update({
            where: { id: run_id },
            data: {
                logsKey: archive_key,
                logsLineCount: final.received,
                logsDroppedLines: final.dropped,
                logsSizeBytes: final.sizeBytes,
            },
        });

        await client
            .multi()
            .del(RunLog.cache_key(run_id))
            .del(RunLog.meta_key(run_id))
            .srem(RUN_LOG_CACHE_INDEX_KEY, run_id)
            .exec();

        await client.publish(
            project_channel_name(final.projectId),
            JSON.stringify({
                type: OutboundSocketMessageType.RUN_LOG_SEALED,
                projectId: final.projectId,
                runId: run_id,
                payload: { eventCount: final.received, droppedEvents: final.dropped },
            }),
        );

        log.info("run log sealed", { run: run_id, segments: final.segments });
    }
}
