"use client";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useIssueStore } from "@/store/issues/useIssueStore";
import CreateIssueForm from "./CreateIssueForm";

export default function CreateIssueDialog() {
    const mode = useIssueStore((s) => s.mode);
    const close = useIssueStore((s) => s.close);

    if (mode?.kind !== "create") return null;
    return (
        <Dialog open onOpenChange={close}>
            <DialogContent
                showCloseButton={false}
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    (event.currentTarget as HTMLElement).focus();
                }}
                className={cn(
                    "flex flex-col max-h-[80vh] min-h-[40vh] w-187.5 max-w-none sm:max-w-none p-0 gap-0 overflow-hidden",
                    "bg-charcoal rounded-3xl",
                )}
            >
                <CreateIssueForm target={mode.target} onCreated={close} />
            </DialogContent>
        </Dialog>
    );
}
