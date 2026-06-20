import PublisherSystem from "../real-time/publisher.system";

export default class InitService {
    public publisher: PublisherSystem;
    constructor() {
        this.publisher = new PublisherSystem();
    }
}
