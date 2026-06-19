"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * The "Add list" affordance at the end of the Custom Kanban: a button that
 * swaps into an inline title input. Enter (or "Add list") creates the column
 * and keeps the input open so several lists can be added in a row; Escape or
 * the close button collapses it back to the button.
 */
export default function AddListForm({ onAdd }: { onAdd: (title: string) => void }) {
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState("");

    const submit = () => {
        if (!title.trim()) return;
        onAdd(title);
        setTitle("");
    };

    const close = () => {
        setEditing(false);
        setTitle("");
    };

    if (!editing) {
        return (
            <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex h-9 w-72 shrink-0 items-center gap-1.5 rounded-xl bg-white/2.5 px-3 text-[13px] font-medium text-neutral-400 ring-1 ring-white/5 transition-colors hover:bg-white/5 hover:text-neutral-200 cursor-pointer"
            >
                <Plus className="size-3.5" aria-hidden />
                Add list
            </button>
        );
    }

    return (
        <div className="flex w-72 shrink-0 flex-col gap-2 rounded-xl bg-white/2.5 p-2 ring-1 ring-white/10">
            <Input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="List title…"
                className="h-8"
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        submit();
                    } else if (e.key === "Escape") {
                        close();
                    }
                }}
            />
            <div className="flex items-center gap-1.5">
                <Button type="button" size="sm" onClick={submit} disabled={!title.trim()}>
                    Add list
                </Button>
                <button
                    type="button"
                    aria-label="Cancel"
                    onClick={close}
                    className="flex size-7 cursor-pointer items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-200"
                >
                    <X className="size-4" aria-hidden />
                </button>
            </div>
        </div>
    );
}
