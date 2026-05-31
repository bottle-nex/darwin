import { createClient } from "redis";
import chalk from "chalk";
import { env } from "../configs/env";

export let redis: ReturnType<typeof createClient>;

export default class RedisService {
	static async connect(): Promise<void> {
		redis = createClient({ url: env.SERVER_REDIS_URL });

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
		if (redis?.isOpen) {
			await redis.quit();
		}
	}
}
