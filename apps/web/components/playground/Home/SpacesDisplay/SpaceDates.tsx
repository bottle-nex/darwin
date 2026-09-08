"use client";
import { CalendarIcon } from "@trydarwin/ui/icons";

import { DATE_ICON_COLOR } from "@/components/playground/Issue/issueHelpers";
import { Button } from "@/components/ui/button";
import DatePopover from "@/components/ui/DatePopover";
import IconWrapper from "@/components/ui/IconWrapper";
import { useSpaceActions } from "@/hooks/kanban/useSpaceActions";
import { shortDate } from "@/lib/format";
import type { BoardSpace } from "@/types/board";

import { cn } from "../../../../../../packages/editorial/lib/cn";

type SpaceDateButtonProps = {
    date: string | null;
    label: string;
    iconClassName: string;
    canEdit: boolean;
    range: { from?: Date; to?: Date };
    earliest?: Date;
    latest?: Date;
    onPick: (next: Date | undefined) => void;
};

/**
 * One end of a space's schedule. With a date it reads as the same outline chip an
 * issue card uses; without one it is a calendar button that only appears while the
 * row is hovered, so empty rows stay quiet.
 */
function SpaceDateButton({
    date,
    label,
    canEdit,
    range,
    earliest,
    latest,
    onPick,
}: SpaceDateButtonProps) {
    if (!date && !canEdit) return null;

    const trigger = date ? (
        <Button
            variant="unstyled"
            type="button"
            aria-label={label}
            data-row-editor
            disabled={!canEdit}
            className={cn(canEdit ? "w-fit cursor-pointer" : "w-fit", "group")}
        >
            <IconWrapper
                variant="ghost"
                icon={CalendarIcon}
                iconClassName={"size-4.25 group-hover:text-snow"}
                className="text-[12px] flex items-center h-6.5"
            >
                <span className="text-snow/90 font-medium">{shortDate(date)}</span>
            </IconWrapper>
        </Button>
    ) : (
        <Button
            variant="unstyled"
            type="button"
            aria-label={label}
            data-row-editor
            className="w-fit cursor-pointer ml-1"
        >
            <IconWrapper
                variant="ghost"
                icon={CalendarIcon}
                iconClassName={"size-4.25 hover:text-snow"}
            />
        </Button>
    );

    if (!canEdit) return trigger;

    return (
        <DatePopover
            value={date ? new Date(date) : undefined}
            onChange={onPick}
            title="Target date"
            range={range}
            earliest={earliest}
            latest={latest}
        >
            {trigger}
        </DatePopover>
    );
}

/**
 * The target date, set in place from the list. The start date lives in the space
 * dialog only — one date is enough to scan a row by, and the pair belongs together
 * where you can see both bounds at once.
 */
export default function SpaceDates({
    space,
    canManage,
}: {
    space: BoardSpace;
    canManage: boolean;
}) {
    const { editSpace } = useSpaceActions();

    const startDate = space.startDate ? new Date(space.startDate) : undefined;
    const targetDate = space.targetDate ? new Date(space.targetDate) : undefined;

    return (
        <SpaceDateButton
            date={space.targetDate}
            label={`Target date for ${space.name}`}
            iconClassName={DATE_ICON_COLOR.target}
            canEdit={canManage}
            range={{ from: startDate, to: targetDate }}
            earliest={startDate}
            onPick={(next) => editSpace(space.id, { targetDate: next?.toISOString() ?? null })}
        />
    );
}
