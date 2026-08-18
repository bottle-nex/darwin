"use client";

import { useState } from "react";
import { Toaster } from "@/components/utility/Toast";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { ToastPosition, ToastStatus } from "@/types/toast.type";

const POSITIONS: ToastPosition[] = [
    "top-left",
    "top-center",
    "top-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
];

const STATUS_BUTTONS: { status: ToastStatus; label: string }[] = [
    { status: "default", label: "Default" },
    { status: "success", label: "Success" },
    { status: "info", label: "Info" },
    { status: "warning", label: "Warning" },
    { status: "error", label: "Error" },
];

function fireToast(status: ToastStatus, position: ToastPosition) {
    const title = `${STATUS_BUTTONS.find((s) => s.status === status)?.label} toast!`;
    const description = "Notification description will be here";

    switch (status) {
        case "success":
            return toast.success(title, {
                position,
                description,
                action: { label: "Got It!", onClick: () => {} },
            });
        case "error":
            return toast.error(title, {
                position,
                description,
                action: { label: "Fixing!", onClick: () => {} },
            });
        case "info":
            return toast.info(title, { position, description });
        case "warning":
            return toast.warning(title, { position, description });
        default:
            return toast(title, { position, description });
    }
}

export default function WhyMatcha() {
    const [position, setPosition] = useState<ToastPosition>("bottom-right");

    return (
        <div className="min-h-screen h-full w-screen max-w-[1352px] mx-auto ring-1 ring-snow/10 rounded-lg flex flex-col items-center justify-center gap-6">
            <Toaster position={position} />

            <div className="flex flex-col gap-5 rounded-xl bg-charcoal p-6 ring-1 ring-white/10">
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-medium text-neutral-400">Position</span>
                    <div className="grid grid-cols-3 gap-2">
                        {POSITIONS.map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setPosition(p)}
                                className={cn(
                                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                                    position === p
                                        ? "bg-matcha text-matcha-foreground"
                                        : "bg-white/6 text-neutral-300 hover:bg-white/10",
                                )}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <span className="text-xs font-medium text-neutral-400">Status</span>
                    <div className="flex flex-wrap gap-2">
                        {STATUS_BUTTONS.map(({ status, label }) => (
                            <button
                                key={status}
                                type="button"
                                onClick={() => fireToast(status, position)}
                                className="rounded-lg bg-white/8 px-4 py-2 text-sm font-medium text-neutral-100 transition-colors hover:bg-white/14"
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
