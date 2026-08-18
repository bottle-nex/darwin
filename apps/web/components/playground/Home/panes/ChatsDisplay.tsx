"use client";
import { PaneLeadSlot } from "@/components/playground/Core/components/PlaygroundPaneSlots";
import ThreadPanelSidebar from "./ThreadPanelSidebar";
import ThreadDisplay from "./ThreadDisplay";
import ChatsBreadcrumb from "./ChatsBreadcrumb";

export default function ChatsDisplay() {
    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <PaneLeadSlot>
                <ChatsBreadcrumb />
            </PaneLeadSlot>
            <div className="flex min-h-0 flex-1">
                <ThreadPanelSidebar />
                <ThreadDisplay />
            </div>
        </div>
    );
}
