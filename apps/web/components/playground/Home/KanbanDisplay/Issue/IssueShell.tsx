"use client";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useIssueDialog } from "@/components/playground/issue/useIssueDialog";

export default function IssueShell({ children }: { children: React.ReactNode }) {
    const { close } = useIssueDialog();
    return (
        <Dialog open onOpenChange={close}>
            <DialogContent
                showCloseButton={false}
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    (event.currentTarget as HTMLElement).focus();
                }}
                className={cn(
                    "h-[80vh] w-[72vw] max-w-none sm:max-w-none p-0 gap-0 overflow-hidden",
                    "bg-cement rounded-lg",
                )}
            >
                {children}
            </DialogContent>
        </Dialog>
    );
}
