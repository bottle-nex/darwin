"use client";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useIssueDialog } from "@/components/playground/issue/useIssueDialog";

/** The modal frame every issue view (form, locked, pending) renders inside. */
export default function IssueShell({ children }: { children: React.ReactNode }) {
    const { close } = useIssueDialog();
    return (
        <Dialog open onOpenChange={close}>
            <DialogContent
                showCloseButton={false}
                className={cn(
                    "h-[80vh] w-[72vw] max-w-none sm:max-w-none p-0 gap-0 overflow-hidden",
                    "bg-[#191919] rounded-[18px]",
                )}
            >
                <div
                    data-slot="slash-command-portal"
                    className="absolute inset-0 z-50 pointer-events-none"
                />
                {children}
            </DialogContent>
        </Dialog>
    );
}
