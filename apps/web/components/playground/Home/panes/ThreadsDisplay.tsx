"use client";
import { MdChat } from "react-icons/md";
import PaneEmptyState from "@/components/playground/Core/components/PaneEmptyState";

/** Shown when the Threads tab is active but no conversation has been picked yet. */
export default function ThreadsDisplay() {
    return (
        <PaneEmptyState
            icon={MdChat}
            title="Select a conversation"
            subtitle="Pick the project chat or an issue thread from the sidebar."
        />
    );
}
