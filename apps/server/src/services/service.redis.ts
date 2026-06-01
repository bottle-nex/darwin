import Redis from "ioredis";
import chalk from "chalk";
import { ENV } from "../configs/env";

export let redis: Redis;

export default class RedisService {
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

    static async disconnect(): Promise<void> {
        if (redis && redis.status !== "end") {
            await redis.quit();
        }
    }
}
