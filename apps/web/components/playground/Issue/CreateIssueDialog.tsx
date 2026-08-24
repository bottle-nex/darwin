"use client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
                className="flex flex-col max-h-[80vh] min-h-[40vh] w-187.5 max-w-none sm:max-w-none p-0 gap-0 overflow-hidden rounded-3xl"
            >
                <CreateIssueForm target={target} onCreated={close} />
            </DialogContent>
        </Dialog>
    );
}
