import PubSubSystem from "./pubsub.server";

export default class SubscriberSystem extends PubSubSystem {
    public subscribe(project_id: string) {
        return this.redis.subscribe(this.get_channel_name(project_id));
    }

    public unsubscribe(project_id: string) {
        return this.redis.unsubscribe(this.get_channel_name(project_id));
    }

    // Param names below are required TypeScript function-type syntax, not bindings;
    // core no-unused-vars false-positives on them (no TS-aware rule configured).
    // eslint-disable-next-line no-unused-vars
    public on_message(handler: (project_id: string, message: string) => void) {
        this.redis.on("message", (channel: string, message: string) => {
            handler(this.get_project_id(channel), message);
        });
    }
}
