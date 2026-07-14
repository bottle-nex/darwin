import type { QueryClient } from "@tanstack/react-query";
import { OutboundSocketMessageType, type OutboundSocketMessage } from "@trymatcha/types";
import { toast } from "sonner";
import { BOARD_QUERY_KEY } from "@/hooks/issues/useBoard";
import { upsert_chat } from "@/hooks/chats/useChats";

export class SocketHandlers {
    /** a new issue was created in the project -> refetch that project's board. */
    static handle_issue_created(queryClient: QueryClient, projectId: string) {
        queryClient.invalidateQueries({ queryKey: [...BOARD_QUERY_KEY, projectId] });
    }

    /** a new comment landed -> merge it into that issue's cached chat list. */
    static handle_chat_created(queryClient: QueryClient, message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.CHAT_CREATED) return;
        upsert_chat(queryClient, message.payload);
    }

    /** the server rejected a comment we sent -> surface the reason. */
    static handle_chat_error(message: OutboundSocketMessage) {
        if (message.type !== OutboundSocketMessageType.CHAT_ERROR) return;
        toast.error(message.message);
    }
}
