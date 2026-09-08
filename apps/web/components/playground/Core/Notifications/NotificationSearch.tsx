"use client";
import { CloseIcon, SearchIcon } from "@trydarwin/ui/icons";

import { Input } from "@/components/ui/input";

type NotificationSearchProps = {
    value: string;
    onChange: (value: string) => void;
};

export default function NotificationSearch({ value, onChange }: NotificationSearchProps) {
    return (
        <div className="relative">
            <SearchIcon
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-neutral-400"
                aria-hidden
            />
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Search notifications"
                className="h-8 rounded-md bg-white/4 pr-8 pl-8 text-[12.5px] shadow-none hover:bg-white/7"
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange("")}
                    aria-label="Clear search"
                    className="absolute top-1/2 right-2 flex size-4 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/7 text-neutral-300 transition-colors hover:bg-white/12 hover:text-neutral-100"
                >
                    <CloseIcon className="size-2.5" aria-hidden />
                </button>
            )}
        </div>
    );
}
