import type { Issue } from "@trymatcha/types";
import { useIssuesStore } from "@/store/issues/useIssuesStore";

const is_issue = (payload: unknown): payload is Issue => {
    return typeof payload === "object" && payload !== null && "id" in payload && "title" in payload;
};

export class SocketHandlers {
    static handle_issue_created(payload: unknown) {
        if (!is_issue(payload)) return;
        const { add_realtime_issue } = useIssuesStore.getState();
        add_realtime_issue(payload);
    }
}
