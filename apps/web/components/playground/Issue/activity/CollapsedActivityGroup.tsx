"use client";
import { useState } from "react";
import { HiChevronDown } from "react-icons/hi2";
import type { IssueActivity } from "@trymatcha/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ActivityRow from "./ActivityRow";
import { activity_entry } from "./activity.registry";

// Three names, then a trailing ellipsis — enough to tell what the run was about.
const NAMED_LIMIT = 3;

function summarize(rows: IssueActivity[]): string {
    const names = [...new Set(rows.map((row) => activity_entry(row.type).summary))];
    const shown = names.slice(0, NAMED_LIMIT).join(", ");
    return names.length > NAMED_LIMIT ? `${shown}...` : shown;
}

export default function CollapsedActivityGroup({
    rows,
    rail,
}: {
    rows: IssueActivity[];
    rail: { above: boolean; below: boolean };
}) {
    const [expanded, setExpanded] = useState(false);

    return (
        <>
            <li className="relative flex items-start gap-x-2.5 py-1">
                {/* The toggle sits where a row's icon would, so the rail passes behind it. */}
                <span className="size-[22px] shrink-0" aria-hidden />
                <Button
                    variant="unstyled"
                    type="button"
                    onClick={() => setExpanded((previous) => !previous)}
                    className="flex min-w-0 cursor-pointer items-start gap-x-1 text-left text-[13px] leading-[22px] text-neutral-500 transition-colors hover:text-neutral-300"
                >
                    <span className="min-w-0 wrap-anywhere">
                        {expanded
                            ? `Hide ${rows.length} events`
                            : `Show ${rows.length} events: ${summarize(rows)}`}
                    </span>
                    <HiChevronDown
                        className={cn(
                            "mt-[5px] size-3.5 shrink-0 transition-transform",
                            expanded && "rotate-180",
                        )}
                    />
                </Button>
            </li>
            {expanded &&
                rows.map((row, index) => (
                    <ActivityRow
                        key={row.id}
                        activity={row}
                        rail={{
                            above: index > 0 || rail.above,
                            below: index < rows.length - 1 || rail.below,
                        }}
                    />
                ))}
        </>
    );
}
