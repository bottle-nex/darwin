"use client";
import { SearchIcon } from "@trydarwin/ui/icons";
import { useEffect, useRef } from "react";

import { Input } from "@/components/ui/input";

type PlaygroundSearchInputProps = {
    value: string;
    onChange: (value: string) => void;
    onClose: () => void;
    placeholder: string;
};

export default function PlaygroundSearchInput({
    value,
    onChange,
    onClose,
    placeholder,
}: PlaygroundSearchInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Escape") onClose();
    }

    return (
        <div className="relative flex w-full items-center">
            <SearchIcon
                className="pointer-events-none absolute left-3 size-3.5 text-neutral-400"
                aria-hidden
            />
            <Input
                ref={inputRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="h-7 w-full rounded-md bg-transparent pr-3 pl-8 text-[12px] text-neutral-100 placeholder:text-neutral-500 hover:bg-transparent focus:border-white/25 focus:outline-none shadow-none"
            />
        </div>
    );
}
