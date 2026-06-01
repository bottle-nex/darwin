import Redis from "ioredis";
import chalk from "chalk";
import { ENV } from "../configs/env";

/**
 * Shared ioredis client. Undefined until {@link RedisService.connect} has run, so
 * `connect()` must be awaited during startup before any service touches Redis.
 */
export let redis: Redis;

/**
 * Lifecycle manager for the process-wide Redis connection.
 */
export default class RedisService {
    /**
     * Establish the shared Redis connection and attach lifecycle logging.
     *
     * Built with `lazyConnect` so the socket opens here (under our control) rather than
     * on client construction. Resolves once connected; rejects if the initial connect fails.
     */
    static async connect(): Promise<void> {
        redis = new Redis(ENV.SERVER_REDIS_URL, {
            lazyConnect: true,
            maxRetriesPerRequest: null,
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
