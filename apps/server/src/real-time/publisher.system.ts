import PubSubSystem from "./pubsub.server";

export default class PublisherSystem extends PubSubSystem {
    constructor() {
        super();
    }

    public async publish_message(channel_name: string, message: string) {
        await this.redis.publish(channel_name, message);
    }
}
