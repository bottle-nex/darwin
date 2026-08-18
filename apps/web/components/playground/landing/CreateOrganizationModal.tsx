"use client";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import CreateOrganizationForm from "@/components/playground/landing/CreateOrganizationForm";

export default function CreateOrganizationModal({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border-white/10 bg-charcoal sm:max-w-105">
                <DialogHeader>
                    <DialogTitle className="text-neutral-100">Create organization</DialogTitle>
                    <DialogDescription className="text-neutral-500">
                        Organizations group your projects, teams, and the issues your agents pick
                        up.
                    </DialogDescription>
                </DialogHeader>

                <CreateOrganizationForm
                    onSuccess={() => onOpenChange(false)}
                    onCancel={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
