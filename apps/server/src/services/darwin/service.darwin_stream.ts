import { publisher } from "@trydarwin/services";
import {
    type DarwinEventBody,
    type DarwinRunOutcome,
    type DarwinStreamEvent,
    OutboundSocketMessageType,
} from "@trydarwin/types";

import { redis } from "../service.redis";

const FLUSH_INTERVAL_MS = 60;
const REPLAY_TTL_SECONDS = 3600;
const REPLAY_MAX_EVENTS = 2000;

function replay_key(run_id: string) {
    return `darwin:run:${run_id}:events`;
}

/**
 * Carries one run's events to whoever is watching it.
 *
 * Rides the existing `project:<id>` Redis channel and the `ws` run-subscription fan-out rather
 * than opening a second real-time system. The channel is project-wide, so a teammate's socket
 * server does receive the frame — they never see it because they were refused at subscribe time.
 *
 * Token events are batched on a short timer: publishing one Redis message per token would be one
 * round trip per word.
 *
 * @example
 * const stream = new DarwinStream(projectId, runId);
 * stream.emit({ type: "token", text: "Hello" });
 * await stream.seal("Done");
 */
export default class DarwinStream {
    private seq = 0;
    private pending: DarwinStreamEvent[] = [];
    private timer: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private readonly project_id: string,
        private readonly run_id: string,
    ) {}

    /** Stamp an event with its sequence number and queue it for the next flush. */
    emit(event: DarwinEventBody) {
        this.pending.push({ ...event, seq: ++this.seq } as DarwinStreamEvent);
        if (this.timer) return;
        this.timer = setTimeout(() => {
            this.timer = null;
            void this.flush();
        }, FLUSH_INTERVAL_MS);
    }

    /**
     * Publish everything queued and record it for replay.
     *
     * The replay set is what lets a reconnecting client ask for "everything after seq N" instead
     * of losing the tokens it missed while the tab was reloading.
     */
    async flush() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        if (!this.pending.length) return;

        const events = this.pending;
        this.pending = [];

        try {
            await redis
                .multi()
                .zadd(
                    replay_key(this.run_id),
                    ...events.flatMap((event) => [event.seq, JSON.stringify(event)]),
                )
                .zremrangebyrank(replay_key(this.run_id), 0, -REPLAY_MAX_EVENTS - 1)
                .expire(replay_key(this.run_id), REPLAY_TTL_SECONDS)
                .exec();
        } catch (error) {
            console.error("[darwin] replay buffer write failed", error);
        }

        await publisher().publish_message(
            publisher().get_channel_name(this.project_id),
            JSON.stringify({
                type: OutboundSocketMessageType.DARWIN_RUN_APPENDED,
                projectId: this.project_id,
                runId: this.run_id,
                payload: { events, cursor: events[events.length - 1]!.seq },
            }),
        );
    }

    /** Flush the tail and tell subscribers the run is over. */
    async seal(status: DarwinRunOutcome) {
        await this.flush();
        await publisher().publish_message(
            publisher().get_channel_name(this.project_id),
            JSON.stringify({
                type: OutboundSocketMessageType.DARWIN_RUN_SEALED,
                projectId: this.project_id,
                runId: this.run_id,
                payload: { status, eventCount: this.seq },
            }),
        );
    }

    /**
     * Everything a reconnecting client missed.
     *
     * @example
     * await DarwinStream.replay("run_7f3d", 12); // events with seq > 12
     */
    static async replay(run_id: string, cursor: number | null): Promise<DarwinStreamEvent[]> {
        const raw = await redis.zrangebyscore(
            replay_key(run_id),
            cursor === null ? "-inf" : `(${cursor}`,
            "+inf",
            "LIMIT",
            0,
            REPLAY_MAX_EVENTS,
        );
        return raw.flatMap((entry) => {
            try {
                return [JSON.parse(entry) as DarwinStreamEvent];
            } catch {
                return [];
            }
        });
    }
}
