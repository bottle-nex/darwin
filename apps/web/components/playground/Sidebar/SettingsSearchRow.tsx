"use client";
import { BackChevronIcon, SearchIcon } from "@trymatcha/ui/icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SettingsSearchRow({
    value,
    onChange,
    onBack,
    onSubmit,
}: {
    value: string;
    onChange: (value: string) => void;
    onBack: () => void;
    onSubmit: () => void;
}) {
    return (
        <div className="flex h-7 w-full items-center gap-1">
            <Button
                variant="unstyled"
                type="button"
                onClick={onBack}
                aria-label="Back"
                className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[6px] bg-snow/5 text-neutral-400 transition-colors hover:bg-snow/8 hover:text-neutral-100"
            >
                <BackChevronIcon className="size-4" aria-hidden />
            </Button>

            <div className="relative min-w-0 flex-1">
                <SearchIcon
                    className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-neutral-400"
                    aria-hidden
                />
                <Input
                    variant="ghost"
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
                    className="h-7 rounded-[6px] bg-snow/5 pl-8 text-[12.5px] hover:bg-snow/7"
                />
            </div>
        </div>
    );
}
