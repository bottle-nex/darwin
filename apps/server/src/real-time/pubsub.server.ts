import { Redis } from "ioredis";
import { ENV } from "../configs/env";

export default abstract class PubSubSystem {
    protected redis: Redis;
    private static readonly CHANNEL_PREFIX = "project:";

    constructor() {
        this.redis = new Redis(ENV.SERVER_REDIS_URL);
    }

    public get_channel_name(project_id: string) {
        return `${PubSubSystem.CHANNEL_PREFIX}${project_id}`;
    }

    public get_project_id(channel_name: string) {
        return channel_name.slice(PubSubSystem.CHANNEL_PREFIX.length);
    }
}
