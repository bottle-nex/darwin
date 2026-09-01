import { Redis } from "ioredis";

export type ChannelScope = "project" | "user";

export type ParsedChannel = { scope: ChannelScope; id: string };

export default abstract class PubSubSystem {
    protected redis: Redis;
    private static readonly PROJECT_CHANNEL_PREFIX = "project:";
    private static readonly USER_CHANNEL_PREFIX = "user:";

    constructor() {
        const url = process.env.SERVER_REDIS_URL;
        if (!url) {
            throw new Error("SERVER_REDIS_URL is not set — cannot reach the realtime bus");
        }
        this.redis = new Redis(url);
    }

    public get_channel_name(project_id: string) {
        return `${PubSubSystem.PROJECT_CHANNEL_PREFIX}${project_id}`;
    }

    public get_user_channel_name(user_id: string) {
        return `${PubSubSystem.USER_CHANNEL_PREFIX}${user_id}`;
    }

    public parse_channel(channel_name: string): ParsedChannel | null {
        if (channel_name.startsWith(PubSubSystem.PROJECT_CHANNEL_PREFIX)) {
            return {
                scope: "project",
                id: channel_name.slice(PubSubSystem.PROJECT_CHANNEL_PREFIX.length),
            };
        }
        if (channel_name.startsWith(PubSubSystem.USER_CHANNEL_PREFIX)) {
            return {
                scope: "user",
                id: channel_name.slice(PubSubSystem.USER_CHANNEL_PREFIX.length),
            };
        }
        return null;
    }
}
