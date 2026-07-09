"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ALL_LABELS } from "../data";
import type { Priority } from "../types";
import { TaskTargetBadge } from "../taskTheme";
import { PRIORITIES } from "./data";
import type { NewCardInput } from "./types";

const NO_LABEL = "none";

type AddCardModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** The column the card lands in — shown for context in the header. */
    columnTitle: string;
    onSubmit: (input: NewCardInput) => void;
    /** Prefill for edit mode; omit to create a fresh card. */
    initial?: NewCardInput;
    /** Header title — defaults to "New card". */
    heading?: string;
    /** Submit button label — defaults to "Add card". */
    submitLabel?: string;
};

/**
 * Centered overlay for creating or editing a card on the Custom Kanban — the
 * Trello "new card" panel rebuilt as a modal. Collects title, description, label,
 * and priority, then hands the values back. Pass `initial` (plus a `key` from the
 * caller so it remounts per card) to drive it in edit mode.
 */
export default function AddCardModal({
    open,
    onOpenChange,
    columnTitle,
    onSubmit,
    initial,
    heading = "New card",
    submitLabel = "Add card",
}: AddCardModalProps) {
    const [title, setTitle] = useState(initial?.title ?? "");
    const [description, setDescription] = useState(initial?.description ?? "");
    const [label, setLabel] = useState<string>(initial?.label ?? NO_LABEL);
    const [priority, setPriority] = useState<Priority>(initial?.priority ?? "normal");

    const reset = () => {
        setTitle(initial?.title ?? "");
        setDescription(initial?.description ?? "");
        setLabel(initial?.label ?? NO_LABEL);
        setPriority(initial?.priority ?? "normal");
    };

    const close = () => {
        onOpenChange(false);
        reset();
    };

    const submit = () => {
        if (!title.trim()) return;
        onSubmit({
            title,
            description,
            label: label === NO_LABEL ? undefined : label,
            priority,
        });
        close();
    };

    return (
        <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
            <DialogContent className="dark border-neutral-800 bg-charcoal text-neutral-100 sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-neutral-100">{heading}</DialogTitle>
                    <DialogDescription className="sr-only">
                        New card in “{columnTitle}”.
                    </DialogDescription>
                </DialogHeader>

                <TaskTargetBadge kind="custom" columnTitle={columnTitle} />

                <div className="flex flex-col gap-4">
                    <Field label="Title">
                        <Input
                            autoFocus
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What needs to be done?"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    submit();
                                }
                            }}
                        />
                    </Field>

                    <Field label="Description">
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a more detailed description…"
                            className="min-h-24 rounded-lg border-0 bg-[#1a1a1a] px-4 py-2.5 text-sm text-[#e5e5e5] shadow-[inset_0_1px_0_0_#262626] placeholder:text-[#737373] focus-visible:border-0 focus-visible:ring-0"
                        />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Label">
                            <Select value={label} onValueChange={setLabel}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={NO_LABEL}>No label</SelectItem>
                                    {ALL_LABELS.map((l) => (
                                        <SelectItem key={l.name} value={l.name}>
                                            <span
                                                className={cn(
                                                    "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium",
                                                    l.className,
                                                )}
                                            >
                                                {l.name}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field label="Priority">
                            <Select
                                value={priority}
                                onValueChange={(v) => setPriority(v as Priority)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PRIORITIES.map((p) => (
                                        <SelectItem key={p.value} value={p.value}>
                                            {p.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" type="button" onClick={close}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={submit} disabled={!title.trim()}>
                        {submitLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/** Small labelled field wrapper to keep the form markup flat and consistent. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-neutral-400">{label}</span>
            {children}
        </label>
    );
}
