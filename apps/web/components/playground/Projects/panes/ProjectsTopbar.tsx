"use client";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Header for the Projects surface — mirrors the Kanban topbar. The right side
 * toggles the settings panel.
 */
export default function ProjectsTopbar({
    settingsOpen,
    onToggleSettings,
}: {
    settingsOpen: boolean;
    onToggleSettings: () => void;
}) {
    return (
        <header className="flex h-11 shrink-0 items-center justify-end gap-2 border-b border-white/5 px-3">
            <button
                type="button"
                onClick={onToggleSettings}
                aria-label="Project settings"
                className={cn(
                    "flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md",
                    settingsOpen
                        ? "bg-white/10 text-neutral-100"
                        : "text-neutral-400 hover:bg-white/5 hover:text-neutral-100",
                )}
            >
                <Settings className="size-3.5" aria-hidden />
            </button>
        </header>
    );
}
