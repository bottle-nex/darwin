"use client";
import { useState } from "react";

import ConfirmDialog from "@/components/utility/ConfirmDialog";
import useRevokeInvite from "@/hooks/invitations/useRevokeInvite";
import { toast } from "@/lib/toast";
import { useMemberSelectionStore } from "@/store/team/useMemberSelectionStore";
import { useRevokeInvitesStore } from "@/store/team/useRevokeInvitesStore";

export default function RevokeInvitesDialog({ teamId }: { teamId: string }) {
    const invitationIds = useRevokeInvitesStore((s) => s.invitationIds);
    const close = useRevokeInvitesStore((s) => s.close);
    const revokeInvite = useRevokeInvite(teamId);
    const [failed, setFailed] = useState(false);

    const count = invitationIds.length;
    const many = count > 1;

    function dismiss() {
        close();
        setFailed(false);
    }

    async function confirmRevoke() {
        setFailed(false);
        const results = await Promise.allSettled(
            invitationIds.map((invitationId) => revokeInvite.mutateAsync(invitationId)),
        );
        const rejected = results.filter((result) => result.status === "rejected").length;

        if (rejected === count) {
            setFailed(true);
            return;
        }
        if (rejected) {
            toast.warning(`Couldn't revoke ${rejected} of ${count} invites.`);
        } else {
            toast.success(many ? `Revoked ${count} invites.` : "Invite revoked.");
        }
        close();
        useMemberSelectionStore.getState().clear();
    }

    return (
        <ConfirmDialog
            open={count > 0}
            onOpenChange={(next) => !next && dismiss()}
            title={many ? `Revoke ${count} invites?` : "Revoke this invite?"}
            description={
                many ? (
                    <>
                        The links in all{" "}
                        <span className="font-medium text-neutral-200">{count}</span> invite emails
                        stop working. You can invite them again later.
                    </>
                ) : (
                    <>
                        The link in that invite email stops working. You can invite them again
                        later.
                    </>
                )
            }
            cancel={{ label: "Cancel", variant: "tertiary", onClick: dismiss }}
            confirm={{
                label: "Revoke",
                variant: "destructive",
                onClick: () => void confirmRevoke(),
            }}
            pending={revokeInvite.isPending}
            error={
                failed
                    ? many
                        ? "Couldn't revoke those invites. Try again."
                        : "Couldn't revoke the invite. Try again."
                    : undefined
            }
        />
    );
}
