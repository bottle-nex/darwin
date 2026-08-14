import { DialogTitle } from "@/components/ui/dialog";
import LogoLoader from "@/components/app/LogoLoader";
import IssueShell from "./IssueShell";

/** Shown while the board query resolves, or when a deep-linked issue no longer exists. */
export default function IssuePending({ resolved }: { resolved: boolean }) {
    return (
        <IssueShell>
            <DialogTitle className="sr-only">Issue</DialogTitle>
            {resolved ? (
                <div className="flex h-full items-center justify-center">
                    <p className="text-[13px] text-neutral-500">This issue no longer exists.</p>
                </div>
            ) : (
                <LogoLoader className="h-full w-full text-snow" />
            )}
        </IssueShell>
    );
}
