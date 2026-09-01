import Logger from "@trymatcha/logger";
import Redis from "ioredis";

import { ENV } from "../../conf/config.env";

const log = Logger.scope("redis");

// after this time the agent will continue to solve further
const REDIS_COMMAND_TIMEOUT_MS = 2_000;

let client: Redis | null = null;

export function redis(): Redis {
    if (!client) {
        client = new Redis(ENV.REDIS_URL, {
            maxRetriesPerRequest: 2,
            commandTimeout: REDIS_COMMAND_TIMEOUT_MS,
        });
        client.on("error", (error) => log.error("client error", error));
    }
    return client;
}

export async function disconnect_redis(): Promise<void> {
    if (client && client.status !== "end") await client.quit();
    client = null;
}
