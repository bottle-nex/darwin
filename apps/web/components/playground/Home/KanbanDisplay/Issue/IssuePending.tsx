import { DialogTitle } from "@/components/ui/dialog";
import IssueShell from "./IssueShell";

/** Shown while the board query resolves, or when a deep-linked issue no longer exists. */
export default function IssuePending({ resolved }: { resolved: boolean }) {
    return (
        <IssueShell>
            <div className="flex flex-col items-start gap-y-2">
                <DialogTitle className="text-left text-base text-neutral-100">Issue</DialogTitle>
                <p className="text-[13px] text-neutral-500">
                    {resolved ? "This issue no longer exists." : "Loading this issue…"}
                </p>
            </div>
        </IssueShell>
    );
}
