"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { MdSearch } from "react-icons/md";

import { cn } from "@/lib/utils";

function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
    return (
        <CommandPrimitive
            data-slot="command"
            className={cn(
                "flex h-full w-full flex-col overflow-hidden rounded-md bg-charcoal text-neutral-100",
                className,
            )}
            {...props}
        />
    );
}

function CommandInput({
    className,
    ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
    return (
        <div data-slot="command-input-wrapper" className="flex items-center gap-2 border-b border-white/10 px-3">
            <MdSearch className="size-4 shrink-0 text-neutral-500" />
            <CommandPrimitive.Input
                data-slot="command-input"
                className={cn(
                    "flex h-9 w-full rounded-md bg-transparent py-3 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 disabled:cursor-not-allowed disabled:opacity-50",
                    className,
                )}
                {...props}
            />
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

function CommandGroup({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>) {
    return (
        <CommandPrimitive.Group
            data-slot="command-group"
            className={cn(
                "overflow-hidden p-1 text-neutral-200 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-neutral-500",
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
            className={cn(
                "relative flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-neutral-200 outline-none select-none",
                "data-[selected=true]:bg-white/8 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
                "[&_svg]:pointer-events-none [&_svg]:shrink-0",
                className,
            )}
            {...props}
        />
    );
}

export { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem };
