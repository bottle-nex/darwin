"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MENU_SURFACE } from "@/components/ui/menuSurface";

export const TABLE_PICKER_MAX_ROWS = 8;
export const TABLE_PICKER_MAX_COLS = 10;

interface TableSizePickerProps {
    rows: number;
    cols: number;
    onHover: (size: { rows: number; cols: number }) => void;
    onSelect: (size: { rows: number; cols: number }) => void;
}

export default function TableSizePicker({ rows, cols, onHover, onSelect }: TableSizePickerProps) {
    return (
        <div
            className={cn(MENU_SURFACE, "pointer-events-auto flex flex-col items-center gap-2 p-2")}
        >
            <div className="flex flex-col gap-1">
                {Array.from({ length: TABLE_PICKER_MAX_ROWS }, (_, row) => (
                    <div key={row} className="flex gap-1">
                        {Array.from({ length: TABLE_PICKER_MAX_COLS }, (_, col) => (
                            <Button
                                variant="unstyled"
                                key={col}
                                type="button"
                                aria-label={`${row + 1} by ${col + 1} table`}
                                onMouseDown={(event) => event.preventDefault()}
                                onMouseEnter={() => onHover({ rows: row + 1, cols: col + 1 })}
                                onClick={() => onSelect({ rows: row + 1, cols: col + 1 })}
                                className={cn(
                                    "size-4 cursor-pointer rounded-[3px] border transition-colors",
                                    row < rows && col < cols
                                        ? "border-primary bg-primary/40"
                                        : "border-white/15 bg-white/5",
                                )}
                            />
                        ))}
                    </div>
                ))}
            </div>
            <span className="text-[12px] text-neutral-400">
                {rows} x {cols}
            </span>
        </div>
    );
}
