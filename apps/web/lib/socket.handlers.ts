import type { OutboundSocketMessage } from "@trymatcha/types";
import { useIssuesStore } from "@/store/issues/useIssuesStore";

export class SocketHandlers {
    static handle_issue_created(message: OutboundSocketMessage) {
        const { add_realtime_issue } = useIssuesStore.getState();
        add_realtime_issue(message.payload);
    }
}
