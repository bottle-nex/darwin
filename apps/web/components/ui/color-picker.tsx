"use client";

import * as React from "react";
import { HexColorPicker } from "react-colorful";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ColorPickerProps = {
    value: string;
    onChange: (hex: string) => void;
    className?: string;
};

// Strip a leading "#" and keep only hex characters, lowercased.
function sanitize(raw: string): string {
    return raw
        .replace(/^#/, "")
        .replace(/[^0-9a-fA-F]/g, "")
        .toLowerCase();
}

// Expand a valid 3-digit shorthand into 6 digits; otherwise return the
// 6-digit value as-is. Returns null when not a complete hex color.
function normalize(hex: string): string | null {
    if (/^[0-9a-f]{6}$/.test(hex)) {
        return `#${hex}`;
    }
    if (/^[0-9a-f]{3}$/.test(hex)) {
        return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
    }
    return null;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
    const [text, setText] = React.useState(() => sanitize(value));

    // Keep the raw text field in sync when the controlled value changes from
    // outside (e.g. picking on the saturation/hue panels or a preset swatch).
    // Adjusting state during render (vs. an effect) avoids a cascading re-render.
    const [prevValue, setPrevValue] = React.useState(value);
    if (value !== prevValue) {
        setPrevValue(value);
        setText(sanitize(value));
    }

    function handleTextChange(event: React.ChangeEvent<HTMLInputElement>) {
        const next = sanitize(event.target.value).slice(0, 6);
        setText(next);
        const normalized = normalize(next);
        if (normalized) {
            onChange(normalized);
        }
    }

    return (
        <div className={cn("flex w-52 flex-col gap-3", className)}>
            <HexColorPicker
                color={value}
                onChange={onChange}
                className="!w-full [&_.react-colorful__hue]:mt-2 [&_.react-colorful__hue]:h-3 [&_.react-colorful__hue]:rounded-full [&_.react-colorful__saturation]:rounded-md"
            />
            <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                    #
                </span>
                <Input
                    value={text}
                    onChange={handleTextChange}
                    spellCheck={false}
                    autoComplete="off"
                    maxLength={6}
                    aria-label="Hex color value"
                    className="h-9 pl-7 font-mono text-sm uppercase"
                />
            </div>
        </div>
    );
}
