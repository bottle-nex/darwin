"use client";
import { motion } from "motion/react";
import { useIssueChatPanelStore } from "@/store/issues/useIssueChatPanelStore";
import IssueChat from "./IssueChat";

const CHAT_PANEL_WIDTH = 360;

/**
 * Stays mounted while collapsed — the composer holds an unsent draft and the
 * thread holds its scroll position, both of which unmounting would discard.
 */
export default function IssueChatPanel({ issueId }: { issueId: string }) {
    const isOpen = useIssueChatPanelStore((s) => s.isOpen);

    return (
        <motion.aside
            aria-label="Comments and activity"
            initial={false}
            animate={{ width: isOpen ? CHAT_PANEL_WIDTH : 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="h-full min-h-0 shrink-0 overflow-hidden"
        >
            <div
                style={{ width: CHAT_PANEL_WIDTH }}
                className="flex h-full min-h-0 flex-col"
                inert={!isOpen}
            >
                <IssueChat issueId={issueId} />
            </div>
        </motion.aside>
    );
}
