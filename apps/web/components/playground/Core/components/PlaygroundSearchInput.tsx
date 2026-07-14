"use client";
import { Input } from "@/components/ui/input";
import { useEffect, useRef } from "react";
import { MdClose, MdSearch } from "react-icons/md";

type PlaygroundSearchInputProps = {
    value: string;
    onChange: (value: string) => void;
    /** Dismiss the search — fired by the close button and by Escape. */
    onClose: () => void;
    placeholder: string;
};

/** Autofocusing, full-width search field with a clear affordance. */
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
            <MdSearch
                className="pointer-events-none absolute left-3 size-3.5 text-neutral-400"
                aria-hidden
            />
            <Input
                ref={inputRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="h-7 w-full rounded-md pr-9 pl-8 text-[12px] text-neutral-100 placeholder:text-neutral-500 focus:border-white/25 focus:outline-none"
            />
            <button
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="absolute right-2 flex size-3.5 cursor-pointer items-center justify-center rounded-full bg-white/10 text-neutral-400 transition-colors hover:bg-white/20 hover:text-neutral-100"
            >
                <MdClose className="size-2.25" aria-hidden />
            </button>
        </div>
    );
}
