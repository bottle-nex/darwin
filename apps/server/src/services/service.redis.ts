import chalk from "chalk";
import Redis from "ioredis";

import { ENV } from "../configs/env";

/**
 * Shared ioredis client. Undefined until {@link RedisService.connect} has run, so
 * `connect()` must be awaited during startup before any service touches Redis.
 */
export let redis: Redis;

export default class RedisService {
    /**
     * Establish the shared Redis connection and attach lifecycle logging.
     *
     * Built with `lazyConnect` so the socket opens here (under our control) rather than
     * on client construction. Resolves once connected; rejects if the initial connect fails.
     *
     * Configured to fail fast when Redis is unavailable: commands retry at most twice
     * (`maxRetriesPerRequest`) and are not buffered while offline (`enableOfflineQueue:
     * false`), so requests error out instead of hanging during an outage.
     */
    static async connect(): Promise<void> {
        redis = new Redis(ENV.REDIS_URL, {
            lazyConnect: true,
            maxRetriesPerRequest: 2,
            enableOfflineQueue: false,
        });

        redis.on("error", (err) => {
            console.error(chalk.red("[redis] client error:"), err);
        });

        redis.on("connect", () => {
            console.log(chalk.green("[redis] connected"));
        });

        redis.on("reconnecting", () => {
            console.warn(chalk.yellow("[redis] reconnecting..."));
        });

        await redis.connect();
    }

    /**
     * Gracefully close the Redis connection, flushing pending commands.
     *
     * No-ops if the client was never created or is already closed, so it is safe to
     * call from shutdown handlers unconditionally.
     */
    static async disconnect(): Promise<void> {
        if (redis && redis.status !== "end") {
            await redis.quit();
        }
    }
}
