import type { ConnectionOptions, QueueOptions } from "bullmq";
import { ENV } from "./config.env";

const queue_config: QueueOptions = {
    connection: ENV.SERVER_REDIS_URL as ConnectionOptions,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 2000,
        },
        removeOnComplete: {
            count: 1000,
            age: 24 * 3600,
        },
    },
};

export default queue_config;
