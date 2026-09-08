"use client";

import { SubmenuDisclosureIcon } from "@trydarwin/ui/icons";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

import { Button } from "./ui/button";
import { MENU_ITEM, MENU_SURFACE } from "./ui/menuSurface";
import { cn } from "./lib/cn";

import {
    isSlashCommandDateInsert,
    isSlashCommandGroup,
    isSlashCommandSizedInsert,
    type SlashCommandEntry,
    type SlashCommandSelection,
} from "./commandItems";
import DateTimePicker, {
    DATE_TIME_SEGMENTS,
    type DateTimeDraft,
    type DateTimeSegment,
    stepDateTime,
} from "./DateTimePicker";
import TableSizePicker, { TABLE_PICKER_MAX_COLS, TABLE_PICKER_MAX_ROWS } from "./TableSizePicker";

interface SlashCommandListProps {
    items: SlashCommandEntry[];
    command: (selection: SlashCommandSelection) => void;
}

export interface SlashCommandListHandle {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface TableSize {
    rows: number;
    cols: number;
}

const ROW_CLASS = cn(MENU_ITEM, "w-full text-left");
const PANEL_CLASS = cn(MENU_SURFACE, "flex w-56 flex-col gap-px pointer-events-auto");

function clamp(value: number, max: number) {
    return Math.min(Math.max(value, 1), max);
}

const SlashCommandList = forwardRef<SlashCommandListHandle, SlashCommandListProps>(
    function SlashCommandList({ items, command }, ref) {
        const [selected, setSelected] = useState(0);
        const [nested, setNested] = useState<number | null>(null);
        const [size, setSize] = useState<TableSize | null>(null);
        const [draft, setDraft] = useState<DateTimeDraft | null>(null);
        const [segment, setSegment] = useState<DateTimeSegment>("day");

        useEffect(() => {
            setSelected(0);
            setNested(null);
            setSize(null);
            setDraft(null);
        }, [items]);

        const entry = items[selected];
        const group = entry && isSlashCommandGroup(entry) ? entry : null;
        const sized = entry && isSlashCommandSizedInsert(entry) ? entry : null;
        const dated = entry && isSlashCommandDateInsert(entry) ? entry : null;

        function leaveSubmenu() {
            setNested(null);
            setSize(null);
            setDraft(null);
        }

        function openDraft() {
            setSegment("day");
            setDraft({ date: new Date(), mode: "datetime" });
        }

        function moveSegment(step: number) {
            const index = DATE_TIME_SEGMENTS.indexOf(segment) + step;
            if (index < 0) {
                setDraft(null);
                return;
            }
            setSegment(DATE_TIME_SEGMENTS[Math.min(index, DATE_TIME_SEGMENTS.length - 1)]);
        }

        function insertDraft(value: DateTimeDraft) {
            if (dated)
                command({
                    ...dated,
                    datetime: { iso: value.date.toISOString(), mode: value.mode },
                });
        }

        function selectRow(index: number) {
            setSelected(index);
            leaveSubmenu();
        }

        useImperativeHandle(ref, () => ({
            onKeyDown({ event }) {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    const step = event.key === "ArrowDown" ? 1 : -1;
                    if (group && nested !== null) {
                        const count = group.items.length;
                        setNested((prev) => ((prev ?? 0) + step + count) % count);
                    } else if (dated && draft) {
                        setDraft(stepDateTime(draft, segment, -step));
                    } else if (sized && size) {
                        setSize({ ...size, rows: clamp(size.rows + step, TABLE_PICKER_MAX_ROWS) });
                    } else {
                        setSelected((prev) => (prev + step + items.length) % items.length);
                        leaveSubmenu();
                    }
                    return true;
                }
                if (event.key === "ArrowRight") {
                    if (group && nested === null) {
                        setNested(0);
                        return true;
                    }
                    if (sized) {
                        setSize(
                            size
                                ? { ...size, cols: clamp(size.cols + 1, TABLE_PICKER_MAX_COLS) }
                                : { rows: 1, cols: 1 },
                        );
                        return true;
                    }
                    if (dated) {
                        if (draft) moveSegment(1);
                        else openDraft();
                        return true;
                    }
                    return false;
                }
                if (event.key === "ArrowLeft") {
                    if (dated && draft) {
                        moveSegment(-1);
                        return true;
                    }
                    if (sized && size) {
                        if (size.cols > 1) setSize({ ...size, cols: size.cols - 1 });
                        else setSize(null);
                        return true;
                    }
                    if (nested === null) return false;
                    leaveSubmenu();
                    return true;
                }
                if (event.key === "Enter") {
                    if (dated) {
                        if (draft) insertDraft(draft);
                        else openDraft();
                        return true;
                    }
                    if (sized) {
                        if (size) command({ ...sized, size });
                        else setSize({ rows: 1, cols: 1 });
                        return true;
                    }
                    if (group) {
                        const item = group.items[nested ?? 0];
                        if (nested === null) setNested(0);
                        else if (item) command(item);
                        return true;
                    }
                    if (entry) command(entry);
                    return true;
                }
                return false;
            },
        }));

        if (!items.length) {
            return (
                <div
                    className={cn(
                        MENU_SURFACE,
                        "pointer-events-auto w-56 py-6 text-center text-sm text-neutral-500",
                    )}
                >
                    No matches
                </div>
            );
        }

        return (
            <div onMouseDown={(event) => event.preventDefault()} className="relative">
                <div className={PANEL_CLASS}>
                    {items.map((item, index) => {
                        const Icon = item.icon;
                        const hasSubmenu =
                            isSlashCommandGroup(item) || isSlashCommandSizedInsert(item);
                        return (
                            <Button
                                variant="unstyled"
                                key={item.title}
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                    if (isSlashCommandGroup(item)) setNested(0);
                                    else if (isSlashCommandSizedInsert(item))
                                        setSize({ rows: 1, cols: 1 });
                                    else if (isSlashCommandDateInsert(item)) openDraft();
                                    else command(item);
                                }}
                                onMouseEnter={() => selectRow(index)}
                                data-selected={index === selected}
                                className={ROW_CLASS}
                            >
                                <Icon className="size-4 shrink-0 text-neutral-400" />
                                {item.title}
                                {hasSubmenu && (
                                    <SubmenuDisclosureIcon className="ml-auto size-3.5 shrink-0 text-neutral-500" />
                                )}
                            </Button>
                        );
                    })}
                </div>

                {group && (
                    <div className={cn(PANEL_CLASS, "absolute top-0 left-full ml-1")}>
                        {group.items.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <Button
                                    variant="unstyled"
                                    key={item.title}
                                    type="button"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => command(item)}
                                    onMouseEnter={() => setNested(index)}
                                    data-selected={index === nested}
                                    className={ROW_CLASS}
                                >
                                    <Icon className="size-4 shrink-0 text-neutral-400" />
                                    {item.title}
                                </Button>
                            );
                        })}
                    </div>
                )}

                {dated && draft && (
                    <div className="absolute top-0 left-full ml-1">
                        <DateTimePicker
                            draft={draft}
                            segment={segment}
                            onSegment={setSegment}
                            onStep={(name, step) => {
                                setSegment(name);
                                setDraft(stepDateTime(draft, name, step));
                            }}
                            onInsert={() => insertDraft(draft)}
                        />
                    </div>
                )}

                {sized && (
                    <div className="absolute top-0 left-full ml-1">
                        <TableSizePicker
                            rows={size?.rows ?? 1}
                            cols={size?.cols ?? 1}
                            onHover={setSize}
                            onSelect={(picked) => command({ ...sized, size: picked })}
                        />
                    </div>
                )}
            </div>
        );
    },
);

export default SlashCommandList;
