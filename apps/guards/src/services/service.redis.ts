import Logger from "@trymatcha/logger";
import Redis from "ioredis";

import { ENV } from "../config/config.env";

const log = Logger.scope("redis");

let client: Redis | null = null;

export function redis(): Redis {
    if (!client) {
        client = new Redis(ENV.REDIS_URL, { maxRetriesPerRequest: 2 });
        client.on("error", (error) => log.error("client error", error));
    }
    return client;
}
