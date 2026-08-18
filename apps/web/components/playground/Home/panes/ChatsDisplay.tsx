"use client";
import { PANE_BAR_SHELL } from "@/components/playground/Core/components/paneBar";
import ThreadPanelSidebar from "./ThreadPanelSidebar";
import ThreadDisplay from "./ThreadDisplay";
import ChatsBreadcrumb from "./ChatsBreadcrumb";

export default function ChatsDisplay() {
    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className={PANE_BAR_SHELL}>
                <ChatsBreadcrumb />
            </div>
            <div className="flex min-h-0 flex-1">
                <ThreadPanelSidebar />
                <ThreadDisplay />
            </div>
        </div>
    );
}
