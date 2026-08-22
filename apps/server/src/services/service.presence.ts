import { redis } from "./service.redis";

const PRESENCE_TTL_SECONDS = 60;

const presence_key = (user_id: string) => `presence:user:${user_id}`;

export default class PresenceService {
    static async mark_online(user_id: string): Promise<void> {
        await redis.set(presence_key(user_id), "1", "EX", PRESENCE_TTL_SECONDS);
    }

    static async mark_offline(user_id: string): Promise<void> {
        await redis.del(presence_key(user_id));
    }

    static async refresh(user_ids: string[]): Promise<void> {
        if (!user_ids.length) return;
        const pipeline = redis.pipeline();
        for (const user_id of user_ids) {
            pipeline.set(presence_key(user_id), "1", "EX", PRESENCE_TTL_SECONDS);
        }
        await pipeline.exec();
    }

    static async online_among(user_ids: string[]): Promise<string[]> {
        if (!user_ids.length) return [];
        const values = await redis.mget(user_ids.map((id) => presence_key(id)));
        return user_ids.filter((_, index) => values[index] !== null);
    }
}
