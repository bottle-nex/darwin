"use client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import CreateOrganizationForm from "@/components/playground/landing/CreateOrganizationForm";

export default function CreateOrganizationModal({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    if (!open) return null;
    return (
        <Dialog open onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    (event.currentTarget as HTMLElement).focus();
                }}
                className={cn(
                    "flex flex-col max-h-[80vh] min-h-[40vh] w-150 max-w-none sm:max-w-none p-0 gap-0 overflow-hidden",
                    "bg-charcoal rounded-3xl",
                )}
            >
                <DialogTitle className="sr-only">Create organization</DialogTitle>
                <CreateOrganizationForm
                    onSuccess={() => onOpenChange(false)}
                    onCancel={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
