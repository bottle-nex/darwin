"use client";
import ConfirmDialog from "@/components/utility/ConfirmDialog";
import { useRemoveMembers } from "@/hooks/team/useRemoveMembers";
import { toast } from "@/lib/toast";
import { useMemberSelectionStore } from "@/store/team/useMemberSelectionStore";
import { useRemoveMembersStore } from "@/store/team/useRemoveMembersStore";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";

export default function RemoveMembersDialog({
    teamId,
    teamName,
    orgId,
    orgName,
}: {
    teamId: string;
    teamName: string;
    orgId: string | undefined;
    orgName: string;
}) {
    const pending = useRemoveMembersStore((s) => s.pending);
    const close = useRemoveMembersStore((s) => s.close);
    const viewerId = useUserSessionStore((s) => s.session?.user?.id);
    const removeMembers = useRemoveMembers(orgId, teamId);

    // The server has no self-guard, so this is the last gate before someone
    // removes themselves from their own team.
    const targetIds = (pending?.userIds ?? []).filter((userId) => userId !== viewerId);
    const skippedSelf = (pending?.userIds.length ?? 0) !== targetIds.length;

    const count = targetIds.length;
    const many = count > 1;
    const fromOrg = pending?.scope === "org";
    const place = fromOrg ? orgName : teamName;

    function dismiss() {
        close();
        removeMembers.reset();
    }

    function confirmRemove() {
        if (!pending || !count) return;
        removeMembers.mutate(
            { userIds: targetIds, scope: pending.scope },
            {
                onSuccess: () => {
                    toast.success(
                        many ? `Removed ${count} people from ${place}.` : `Removed from ${place}.`,
                    );
                    close();
                    useMemberSelectionStore.getState().clear();
                },
            },
        );
    }

    return (
        <ConfirmDialog
            open={count > 0}
            onOpenChange={(next) => !next && dismiss()}
            title={
                many ? `Remove ${count} people from ${place}?` : `Remove this person from ${place}?`
            }
            description={
                <>
                    {fromOrg ? (
                        <>
                            This takes them out of{" "}
                            <span className="font-medium text-neutral-200">{orgName}</span> and
                            every team in it. You can&apos;t undo this.
                        </>
                    ) : (
                        <>
                            This takes them out of{" "}
                            <span className="font-medium text-neutral-200">{teamName}</span>. They
                            keep their access to the rest of the project.
                        </>
                    )}
                    {skippedSelf && " You aren't included — you can't remove yourself."}
                </>
            }
            cancel={{ label: "Cancel", variant: "tertiary", onClick: dismiss }}
            confirm={{ label: "Remove", variant: "destructive", onClick: confirmRemove }}
            pending={removeMembers.isPending}
            error={
                removeMembers.isError
                    ? many
                        ? "Couldn't remove those people. Try again."
                        : "Couldn't remove them. Try again."
                    : undefined
            }
        />
    );
}
