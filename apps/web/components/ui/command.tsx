"use client";

import { Command as CommandPrimitive } from "cmdk";
import * as React from "react";
import { MdSearch } from "react-icons/md";

import { cn } from "@/lib/utils";

import { MENU_ITEM } from "./menuSurface";

function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
    return (
        <CommandPrimitive
            data-slot="command"
            className={cn(
                "flex h-full w-full flex-col overflow-hidden rounded-lg text-neutral-100",
                className,
            )}
            {...props}
        />
    );
}

function CommandInput({
    className,
    icon = true,
    border = true,
    trailing,
    ...props
}: React.ComponentProps<typeof CommandPrimitive.Input> & {
    icon?: boolean;
    border?: boolean;
    trailing?: React.ReactNode;
}) {
    return (
        <div
            data-slot="command-input-wrapper"
            className={cn("flex items-center gap-2 px-3", border && "border-b border-white/10")}
        >
            {icon && <MdSearch className="size-4 shrink-0 text-neutral-500" />}
            <CommandPrimitive.Input
                data-slot="command-input"
                className={cn(
                    "flex h-9 w-full rounded-md bg-transparent py-3 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 disabled:cursor-not-allowed disabled:opacity-50",
                    className,
                )}
                {...props}
            />
            {trailing}
        </div>
    );
}

function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
    return (
        <CommandPrimitive.List
            data-slot="command-list"
            className={cn("max-h-64 scroll-py-1 overflow-x-hidden overflow-y-auto p-1", className)}
            {...props}
        />
    );
}

function CommandEmpty({ ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) {
    return (
        <CommandPrimitive.Empty
            data-slot="command-empty"
            className="py-6 text-center text-sm text-neutral-500"
            {...props}
        />
    );
}

function CommandGroup({
    className,
    ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
    return (
        <CommandPrimitive.Group
            data-slot="command-group"
            className={cn(
                "overflow-hidden text-neutral-200 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-neutral-500 [&_[cmdk-group-heading]]:uppercase",
                className,
            )}
            {...props}
        />
    );
}

function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
    return (
        <CommandPrimitive.Item
            data-slot="command-item"
            className={cn(MENU_ITEM, className)}
            {...props}
        />
    );
}

export { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList };
export { defaultFilter } from "cmdk";
