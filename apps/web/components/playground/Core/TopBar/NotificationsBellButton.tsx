"use client";
import { HiOutlineBell } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { useNotificationsPanelStore } from "@/store/playground/useNotificationsPanelStore";

export default function NotificationsBellButton() {
    const isOpen = useNotificationsPanelStore((s) => s.isOpen);
    const toggle = useNotificationsPanelStore((s) => s.toggle);

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label="Toggle notifications"
            aria-pressed={isOpen}
            className={cn(
                "flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100",
                isOpen && "bg-white/5 text-neutral-100",
            )}
        >
            <HiOutlineBell className="size-4" aria-hidden />
        </button>
    );
}
