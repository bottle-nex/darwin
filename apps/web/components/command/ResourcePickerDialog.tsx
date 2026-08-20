"use client";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
    Command,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

export interface PickableResource {
    id: string;
    label: string;
    leading?: ReactNode;
}

export default function ResourcePickerDialog({
    open,
    onOpenChange,
    title,
    placeholder,
    emptyLabel,
    resources,
    destructive = false,
    onPick,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    placeholder: string;
    emptyLabel: string;
    resources: PickableResource[];
    destructive?: boolean;
    onPick: (id: string) => void;
}) {
    if (!open) return null;
    return (
        <Dialog open onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="top-[18%] w-125 max-w-[calc(100%-2rem)] translate-y-0 gap-0 overflow-hidden rounded-2xl border-white/10 p-0 sm:max-w-none"
            >
                <DialogTitle className="sr-only">{title}</DialogTitle>
                <Command loop disablePointerSelection className="bg-transparent">
                    <CommandInput
                        autoFocus
                        border={false}
                        placeholder={placeholder}
                        className="h-10"
                    />
                    <CommandList data-lenis-prevent className="no-scrollbar max-h-80 p-2">
                        <CommandEmpty>{emptyLabel}</CommandEmpty>
                        {resources.map((resource) => (
                            <CommandItem
                                key={resource.id}
                                value={`${resource.label} ${resource.id}`}
                                onSelect={() => onPick(resource.id)}
                                className={cn(
                                    "px-2.5 py-2 hover:bg-white/5 data-[selected=true]:not-hover:bg-transparent",
                                    destructive && "text-rose-300/90",
                                )}
                            >
                                <span className="flex min-w-0 items-center gap-2.5">
                                    {resource.leading}
                                    <span className="truncate">{resource.label}</span>
                                </span>
                            </CommandItem>
                        ))}
                    </CommandList>
                </Command>
            </DialogContent>
        </Dialog>
    );
}
