"use client";
import type { Chat, ProjectChat } from "@trymatcha/types";
import { PaneLeadSlot } from "@/components/playground/Core/components/PlaygroundPaneSlots";
import ProjectChatThread from "@/components/playground/Home/chat/ProjectChatThread";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useProjectChatThread } from "@/hooks/chats/useProjectChatThread";
import ChatsBreadcrumb from "./ChatsBreadcrumb";

export default function ChatsDisplay() {
    const activeProject = useActiveProject();
    const { chats, isLoading, send, remove, react } = useProjectChatThread(activeProject?.id);

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <PaneLeadSlot>
                <ChatsBreadcrumb />
            </PaneLeadSlot>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col *:px-4 *:py-3">
                <ProjectChatThread
                    key={activeProject?.id ?? "none"}
                    chats={chats}
                    projectId={activeProject?.id}
                    loading={isLoading}
                    placeholder="Message the project..."
                    emptyMessage="No messages yet."
                    onSend={send}
                    onDelete={(chat: Chat | ProjectChat) => remove(chat as ProjectChat)}
                    onReaction={(chat: Chat | ProjectChat, emoji: string) =>
                        react(chat as ProjectChat, emoji)
                    }
                />
            </div>
        </div>
    );
}
