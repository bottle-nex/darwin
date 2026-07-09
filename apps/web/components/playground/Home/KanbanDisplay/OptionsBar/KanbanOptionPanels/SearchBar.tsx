"use client";
import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { MdClose, MdSearch } from "react-icons/md";
import { Input } from "@/components/ui/input";
interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    onClose: () => void;
}

/** Search field that slides in beside the toolbar's left edge. Esc closes it. */
export default function SearchBar({ value, onChange, onClose }: SearchBarProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="relative flex shrink-0 items-center overflow-hidden"
        >
            <MdSearch
                className="pointer-events-none absolute left-2.5 size-3.5 text-neutral-500"
                aria-hidden
            />
            <Input
                ref={inputRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Escape") onClose();
                }}
                placeholder="Search issues..."
                className="h-7 w-full rounded-md pr-7 pl-8 text-[12px] text-neutral-100 placeholder:text-neutral-500 focus:border-white/25 focus:outline-none"
            />
            <button
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="absolute right-1.5 flex size-4 cursor-pointer items-center justify-center rounded-full bg-white/10 text-neutral-400 hover:bg-white/20 hover:text-neutral-100"
            >
                <MdClose className="size-2.5" aria-hidden />
            </button>
        </motion.div>
    );
}
