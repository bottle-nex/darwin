"use client";
import type { IconType } from "@trymatcha/ui/icons";

import IconWrapper from "@/components/ui/IconWrapper";
import Pill, { type PillTone } from "@/components/ui/Pill";
import { cn } from "@/lib/utils";

import { SETTINGS_CARD_SHELL } from "../SettingsUtilityCard";

export type IntegrationStatus = "connected" | "available" | "unavailable";

const STATUS_LABEL: Record<IntegrationStatus, string> = {
    connected: "Connected",
    available: "Not connected",
    unavailable: "Unavailable",
};

const STATUS_TONE: Record<IntegrationStatus, PillTone> = {
    connected: "brand",
    available: "muted",
    unavailable: "faint",
};

const STATUS_DOT: Record<IntegrationStatus, string> = {
    connected: "var(--color-primary)",
    available: "color-mix(in srgb, var(--color-snow) 30%, transparent)",
    unavailable: "color-mix(in srgb, var(--color-snow) 20%, transparent)",
};

export default function IntegrationCard({
    icon: Icon,
    name,
    description,
    status,
    note,
    onSelect,
    disabled,
    className,
}: {
    icon: IconType;
    name: string;
    description: string;
    status: IntegrationStatus;
    note?: string;
    onSelect: () => void;
    disabled?: boolean;
    className?: string;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            disabled={disabled}
            aria-label={`${name} — ${STATUS_LABEL[status]}`}
            className={cn(
                SETTINGS_CARD_SHELL,
                "group flex cursor-pointer flex-col gap-3.5 p-4 text-left outline-none transition-colors hover:bg-snow/6 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60",
                className,
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <IconWrapper
                    icon={Icon}
                    className="size-10 shrink-0 rounded-lg bg-graphite/40"
                    iconClassName="size-5 text-snow"
                />
                <Pill tone={STATUS_TONE[status]} dotColor={STATUS_DOT[status]}>
                    {STATUS_LABEL[status]}
                </Pill>
            </div>

            <div className="flex min-w-0 flex-col gap-1">
                <span className="truncate text-sm font-medium text-snow">{name}</span>
                <span className="line-clamp-2 text-[13px] leading-[1.45] text-snow/60">
                    {description}
                </span>
            </div>

            {note && <span className="truncate text-[11px] text-snow/40">{note}</span>}
        </button>
    );
}
