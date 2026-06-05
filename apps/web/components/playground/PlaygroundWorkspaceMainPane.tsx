import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PlaygroundWorkspaceMainPane() {
    return (
        <main className="flex flex-1 min-w-0 flex-col">
            {/* empty state */}
            <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
                <span
                    className="flex size-14 items-center justify-center rounded-2xl bg-charcoal text-neutral-300 ring-1 ring-white/10"
                    aria-hidden
                >
                    <UserPlus className="size-6" />
                </span>
                <h2 className="mt-4 text-[15px] font-semibold text-neutral-100">
                    Looking to collaborate?
                </h2>
                <p className="mt-1 text-[13px] text-neutral-500">
                    Collaboration is one invite away.
                </p>
                <Button
                    size="sm"
                    className="mt-4 h-8 cursor-pointer rounded-[8px] bg-neutral-200 px-4 text-[12px] font-medium text-neutral-900 hover:bg-white"
                >
                    Invite people
                </Button>
            </div>
        </main>
    );
}
