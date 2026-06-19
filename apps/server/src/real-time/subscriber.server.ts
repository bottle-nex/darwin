import { Redis } from "ioredis";
import { ENV } from "../configs/env";

export default class SubscriberSystem {
    public redis: Redis;

    constructor() {
        this.redis = new Redis(ENV.SERVER_REDIS_URL);
    }
}
