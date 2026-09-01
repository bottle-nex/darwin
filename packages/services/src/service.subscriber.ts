import PubSubSystem, { type ParsedChannel } from "./service.pubsub";

export default class SubscriberSystem extends PubSubSystem {
    public subscribe_project(project_id: string) {
        return this.redis.subscribe(this.get_channel_name(project_id));
    }

    public unsubscribe_project(project_id: string) {
        return this.redis.unsubscribe(this.get_channel_name(project_id));
    }

    public subscribe_user(user_id: string) {
        return this.redis.subscribe(this.get_user_channel_name(user_id));
    }

    public unsubscribe_user(user_id: string) {
        return this.redis.unsubscribe(this.get_user_channel_name(user_id));
    }

    // eslint-disable-next-line no-unused-vars
    public on_message(handler: (channel: ParsedChannel, message: string) => void) {
        this.redis.on("message", (channel_name: string, message: string) => {
            const channel = this.parse_channel(channel_name);
            if (channel) handler(channel, message);
        });
    }
}
