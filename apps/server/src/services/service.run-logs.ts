import { gunzipSync } from "node:zlib";

import {
    RUN_LOG_ARCHIVE_EVENT_CAP,
    RUN_LOG_PAGE_LIMIT,
    RunLog,
    type RunLogEvent,
} from "@trydarwin/types";

import { redis } from "./service.redis";
import StorageService from "./service.storage";

export type RunLogSlice = {
    events: RunLogEvent[];
    cursor: number | null;
    droppedEvents: number;
    truncated: boolean;
    live: boolean;
};

type CachedRun = { projectId: string; segments: number; dropped: number };

export default class RunLogService {
    private static async cached_run(run_id: string): Promise<CachedRun | null> {
        const meta = await redis.hmget(
            RunLog.meta_key(run_id),
            "projectId",
            "segments",
            "dropped",
        );
        const [projectId, segments, dropped] = meta;
        if (!projectId) return null;
        return {
            projectId,
            segments: Number(segments ?? 0),
            dropped: Number(dropped ?? 0),
        };
    }

    /**
     * Reads a run's events from wherever they currently live.
     *
     * A live run is split: guards moves finished slices into object storage and drops them from
     * the cache, so the newest events are in Redis while the earlier ones are already archived.
     * The first page therefore reads both and joins them; later pages only ever need the cache,
     * because the cursor has already passed everything the archive holds.
     */
    static async read_page(
        run_id: string,
        sealed_key: string | null,
        cursor: number | null,
        limit = RUN_LOG_PAGE_LIMIT,
    ): Promise<RunLogSlice> {
        const cached = await RunLogService.cached_run(run_id);
        const live = cached !== null;

        const recent = cached ? await RunLogService.read_cache(run_id, cursor, limit) : [];
        const archived =
            cursor === null ? await RunLogService.read_archived(run_id, cached, sealed_key) : [];

        const all = [...archived, ...recent];
        const truncated = all.length > RUN_LOG_ARCHIVE_EVENT_CAP;
        const events = truncated ? all.slice(-RUN_LOG_ARCHIVE_EVENT_CAP) : all;

        return {
            events,
            cursor: events.at(-1)?.seq ?? cursor,
            droppedEvents: cached?.dropped ?? 0,
            truncated,
            live,
        };
    }

    private static async read_cache(
        run_id: string,
        cursor: number | null,
        limit: number,
    ): Promise<RunLogEvent[]> {
        const payloads = await redis.zrangebyscore(
            RunLog.cache_key(run_id),
            cursor === null ? "-inf" : `(${cursor}`,
            "+inf",
            "LIMIT",
            0,
            limit,
        );
        return RunLogService.parse(payloads);
    }

    /**
     * A run that has ended is one object; a run still going is however many segments guards has
     * flushed so far. Both decode the same way once read, so only the fetch differs.
     */
    private static async read_archived(
        run_id: string,
        cached: CachedRun | null,
        sealed_key: string | null,
    ): Promise<RunLogEvent[]> {
        if (cached) {
            if (cached.segments < 1) return [];
            return RunLogService.decode(
                await StorageService.read_run_log_archive(RunLog.prefix(cached.projectId, run_id)),
            );
        }
        if (!sealed_key) return [];
        return RunLogService.decode(await StorageService.read_run_log(sealed_key));
    }

    private static decode(body: Buffer): RunLogEvent[] {
        if (!body.length) return [];
        return RunLogService.parse(gunzipSync(body).toString("utf8").split("\n"));
    }

    private static parse(payloads: string[]): RunLogEvent[] {
        const events: RunLogEvent[] = [];
        for (const payload of payloads) {
            if (!payload) continue;
            try {
                events.push(JSON.parse(payload) as RunLogEvent);
            } catch {
                continue;
            }
        }
        return events;
    }
}
