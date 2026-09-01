import PubSubSystem from "./service.pubsub";

export default class PublisherSystem extends PubSubSystem {
    public async publish_message(channel_name: string, message: string) {
        await this.redis.publish(channel_name, message);
    }
}

let shared: PublisherSystem | null = null;

export function publisher(): PublisherSystem {
    if (!shared) shared = new PublisherSystem();
    return shared;
}
