"use client";
import type { IconType } from "@trydarwin/ui/icons";
import { ExternalLinkIcon } from "@trydarwin/ui/icons";

import { Button } from "@/components/ui/button";
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
    onSelect,
    disabled,
    className,
}: {
    icon: IconType;
    name: string;
    description: string;
    status: IntegrationStatus;
    onSelect: () => void;
    disabled?: boolean;
    className?: string;
}) {
    return (
        <div
            className={cn(
                SETTINGS_CARD_SHELL,
                "flex items-start gap-3 px-4 py-3.5",
                disabled && "opacity-60",
                className,
            )}
        >
            <Icon className="mt-0.5 size-8 shrink-0 text-overlay" aria-hidden />

            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-2.5">
                    <span className="shrink-0 text-[14px] font-semibold text-overlay">{name}</span>
                    <Pill size="sm" tone={STATUS_TONE[status]} dotColor={STATUS_DOT[status]}>
                        {STATUS_LABEL[status]}
                    </Pill>
                </div>
                <span className="text-[12.5px] leading-[1.5] text-overlay/55">{description}</span>
            </div>

            <Button
                type="button"
                variant="flat"
                size="sm"
                onClick={onSelect}
                disabled={disabled}
                className="shrink-0"
            >
                <ExternalLinkIcon className="size-3.5" aria-hidden />
                {status === "connected" ? "Open" : "Connect"}
            </Button>
        </div>
    );
}
