"use client";
import type { ReactNode } from "react";
import { MdCheck } from "react-icons/md";
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
    activeId,
    destructive = false,
    onPick,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    placeholder: string;
    emptyLabel: string;
    resources: PickableResource[];
    activeId?: string | null;
    destructive?: boolean;
    onPick: (id: string) => void;
}) {
    if (!open) return null;
    return (
        <Dialog open onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="top-[18%] w-125 max-w-[calc(100%-2rem)] translate-y-0 gap-0 overflow-hidden rounded-2xl border-white/10 bg-charcoal p-0 sm:max-w-none"
            >
                <DialogTitle className="sr-only">{title}</DialogTitle>
                <Command loop className="bg-transparent">
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
                                    "justify-between px-2.5 py-2",
                                    destructive && "text-rose-300/90",
                                )}
                            >
                                <span className="flex min-w-0 items-center gap-2.5">
                                    {resource.leading}
                                    <span className="truncate">{resource.label}</span>
                                </span>
                                {resource.id === activeId && (
                                    <MdCheck className="size-3.5 shrink-0 text-neutral-400" />
                                )}
                            </CommandItem>
                        ))}
                    </CommandList>
                </Command>
            </DialogContent>
        </Dialog>
    );
}
