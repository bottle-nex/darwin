"use client";
import { useState, type ComponentProps, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type DialogAction = {
    label: string;
    variant?: ComponentProps<typeof Button>["variant"];
    onClick: () => void;
};

export default function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    cancel,
    confirm,
    pending = false,
    typeToConfirm,
    error,
    className,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: ReactNode;
    cancel: DialogAction;
    confirm: DialogAction;
    pending?: boolean;
    typeToConfirm?: string;
    error?: string;
    className?: string;
}) {
    const [typed, setTyped] = useState("");

    const [wasOpen, setWasOpen] = useState(open);
    if (wasOpen !== open) {
        setWasOpen(open);
        if (!open) setTyped("");
    }

    const unlocked = !typeToConfirm || typed.trim() === typeToConfirm;

    function runConfirm() {
        if (pending || !unlocked) return;
        confirm.onClick();
    }

    return (
        <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
            <DialogContent className={cn("sm:max-w-md", className)}>
                <DialogHeader className="gap-1.5">
                    <DialogTitle className="text-base text-neutral-100">{title}</DialogTitle>
                    <DialogDescription className="text-[13px] text-neutral-400">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                {typeToConfirm && (
                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="confirm-dialog-input"
                            className="text-[13px] text-neutral-400"
                        >
                            To confirm, type{" "}
                            <span className="font-mono font-medium text-neutral-200">
                                {typeToConfirm}
                            </span>{" "}
                            below.
                        </label>
                        <Input
                            id="confirm-dialog-input"
                            value={typed}
                            onChange={(e) => setTyped(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && runConfirm()}
                            placeholder={typeToConfirm}
                            autoComplete="off"
                            autoFocus
                            spellCheck={false}
                            aria-invalid={typed.length > 0 && !unlocked}
                        />
                    </div>
                )}

                {error && <p className="text-[12px] text-red-400">{error}</p>}

                <DialogFooter className="mt-2 gap-2">
                    <Button
                        variant={cancel.variant ?? "destructive"}
                        size="sm"
                        style={{ outlineWidth: 0, outlineOffset: 0 }}
                        onClick={cancel.onClick}
                        disabled={pending}
                    >
                        {cancel.label}
                    </Button>
                    <Button
                        variant={confirm.variant ?? "tertiary"}
                        size="sm"
                        style={{ outlineWidth: 0, outlineOffset: 0 }}
                        loading={pending}
                        disabled={!unlocked || pending}
                        onClick={runConfirm}
                    >
                        {confirm.label}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
