"use client";
import { Dialog, DIALOG_COMPOSER_SURFACE, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useCreateIssueStore } from "@/store/issues/useCreateIssueStore";

import CreateIssueForm from "./CreateIssueForm";

export default function CreateIssueDialog() {
    const target = useCreateIssueStore((s) => s.target);
    const close = useCreateIssueStore((s) => s.close);

    if (!target) return null;
    return (
        <Dialog open onOpenChange={close}>
            <DialogContent
                showCloseButton={false}
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    (event.currentTarget as HTMLElement).focus();
                }}
                className={cn(
                    "flex max-h-[80vh] min-h-[40vh] w-187.5 max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none",
                    DIALOG_COMPOSER_SURFACE,
                )}
            >
                <CreateIssueForm target={target} onCreated={close} />
            </DialogContent>
        </Dialog>
    );
}
