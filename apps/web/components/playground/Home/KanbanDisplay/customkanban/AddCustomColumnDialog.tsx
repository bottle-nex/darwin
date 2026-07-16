"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAddCustomColumnStore } from "@/store/kanban/useAddCustomColumnStore";

/** Names and creates a new custom Kanban column, opened from the Add Task menu. */
export default function AddCustomColumnDialog({ onAdd }: { onAdd: (title: string) => void }) {
    const { open, setOpen } = useAddCustomColumnStore();
    const [title, setTitle] = useState("");

    function handleOpenChange(next: boolean) {
        setOpen(next);
        if (!next) setTitle("");
    }

    function submit() {
        const name = title.trim();
        if (!name) return;
        onAdd(name);
        handleOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="border-white/10 bg-charcoal sm:max-w-sm"
            >
                <DialogHeader className="gap-1.5">
                    <DialogTitle className="text-base text-neutral-100">
                        Add custom column
                    </DialogTitle>
                </DialogHeader>

                <Input
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="List title…"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            submit();
                        }
                    }}
                />

                <div className="mt-2 flex justify-end gap-2">
                    <Button variant="tertiary" size="sm" onClick={() => handleOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button size="sm" disabled={!title.trim()} onClick={submit}>
                        Add list
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
