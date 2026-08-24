"use client";
import { type ReactNode, useState } from "react";
import { RxTriangleRight } from "react-icons/rx";

import {
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

const CHEVRON = "ml-auto size-3.5 text-neutral-500";

/**
 * Radix arms a 100ms hover-intent timer before opening a submenu. On menus this
 * dense that reads as lag, so the trigger drives the open state itself — the
 * same shape `IssueDropdown` uses for its context-menu flyouts.
 */
export default function EagerSubmenu({
    trigger,
    className,
    disabled,
    children,
}: {
    trigger: ReactNode;
    className?: string;
    disabled?: boolean;
    children: ReactNode;
}) {
    const [open, setOpen] = useState(false);

    return (
        <DropdownMenuSub open={open} onOpenChange={setOpen}>
            <DropdownMenuSubTrigger
                disabled={disabled}
                onPointerEnter={() => !disabled && setOpen(true)}
            >
                {trigger}
                <RxTriangleRight className={CHEVRON} aria-hidden />
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className={className}>{children}</DropdownMenuSubContent>
        </DropdownMenuSub>
    );
}
