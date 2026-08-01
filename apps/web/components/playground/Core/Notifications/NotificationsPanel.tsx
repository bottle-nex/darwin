"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";
import { Input } from "@/components/ui/input";
import { useNotificationsPanelStore } from "@/store/playground/useNotificationsPanelStore";
import { AiFillNotification } from "react-icons/ai";

const PANEL_WIDTH = 320;

export default function NotificationsPanel() {
    const { isOpen } = useNotificationsPanelStore();
    const [query, setQuery] = useState<string>("");

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.aside
                    aria-label="Notifications"
                    initial={{ width: 0 }}
                    animate={{ width: PANEL_WIDTH }}
                    exit={{ width: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full min-h-0 shrink-0 overflow-hidden"
                >
                    <div
                        style={{ width: PANEL_WIDTH - 8 }}
                        className="ml-2 flex h-full flex-col rounded-lg border border-white/5 bg-charcoal"
                    >
                        <div className="flex flex-col gap-3 p-3">
                            <div className="relative">
                                <HiOutlineMagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-500" />
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search notifications"
                                    className="h-9 pl-9 text-[13px] shadow-none bg-cement"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col flex-1 items-center justify-center gap-y-3 px-4 text-center text-[13px] text-neutral-500">
                            <AiFillNotification size={44} />
                            No notifications yet
                        </div>
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );
}
