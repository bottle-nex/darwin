"use client";
import { SearchIcon } from "@trydarwin/ui/icons";

import { Input } from "@/components/ui/input";

export default function OverviewSearchField({
    value,
    onChange,
    onSubmit,
}: {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
}) {
    return (
        <div className="relative w-full sm:w-72">
            <SearchIcon
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-snow/40"
                aria-hidden
            />
            <Input
                variant="ghost"
                autoFocus
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === "Escape") {
                        event.preventDefault();
                        onChange("");
                        return;
                    }
                    if (event.key === "Enter") {
                        event.preventDefault();
                        onSubmit();
                    }
                }}
                placeholder="Search settings..."
                className="h-9 rounded-md bg-snow/4 pl-9 text-[13px] hover:bg-snow/6 focus-visible:bg-snow/6"
            />
        </div>
    );
}
