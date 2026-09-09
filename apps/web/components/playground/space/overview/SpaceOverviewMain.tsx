"use client";

import { CalendarIcon, KanbanColumnsIcon } from "@trydarwin/ui/icons";

import { IconPickGlyph } from "@/components/ui/IconPicker";
import { shortDate } from "@/lib/format";
import type { SpaceProgress } from "@/lib/spaceOverview";
import { cn } from "@/lib/utils";
import type { BoardSpace } from "@/types/board";

function PropertyChip({
    icon: Icon,
    label,
    muted,
}: {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    label: string;
    muted?: boolean;
}) {
    return (
        <span
            className={cn(
                "inline-flex h-6.5 items-center gap-1.5 rounded-md border border-border px-2 text-[12.5px]",
                muted ? "text-neutral-500" : "text-neutral-300",
            )}
        >
            <Icon className="size-3.5 shrink-0 text-neutral-400" aria-hidden />
            {label}
        </span>
    );
}

export default function SpaceOverviewMain({
    space,
    progress,
    onEdit,
}: {
    space: BoardSpace;
    progress: SpaceProgress;
    onEdit?: () => void;
}) {
    const dates =
        space.startDate || space.targetDate
            ? [
                  space.startDate ? shortDate(space.startDate) : "Start",
                  space.targetDate ? shortDate(space.targetDate) : "Target",
              ].join(" → ")
            : "Set dates";
    const summary = space.description?.trim();

    return (
        <div className="flex flex-col gap-6">
            {space.icon && (
                <div className="surface-card flex size-11 items-center justify-center rounded-lg">
                    <IconPickGlyph pick={space.icon} className="size-5.5 text-[22px]" />
                </div>
            )}

            <div className="flex flex-col gap-2.5">
                <h2 className="text-[26px] leading-8 font-semibold tracking-[-0.01em] text-overlay">
                    {space.name}
                </h2>
                <button
                    type="button"
                    onClick={onEdit}
                    disabled={!onEdit}
                    className={cn(
                        "w-fit text-left text-[14.5px] leading-6",
                        summary ? "text-neutral-300" : "text-neutral-500",
                        onEdit && "cursor-pointer transition-colors hover:text-neutral-200",
                    )}
                >
                    {summary ?? "Add a short summary..."}
                </button>
            </div>

            <div className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-[13px] text-neutral-500">Properties</span>
                <div className="flex flex-wrap items-center gap-1.5">
                    <PropertyChip
                        icon={CalendarIcon}
                        label={dates}
                        muted={!space.startDate && !space.targetDate}
                    />
                    <PropertyChip
                        icon={KanbanColumnsIcon}
                        label={`${progress.columns.length} ${progress.columns.length === 1 ? "column" : "columns"}`}
                        muted={progress.columns.length === 0}
                    />
                </div>
            </div>
        </div>
    );
}
