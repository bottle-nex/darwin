"use client";
import ConfirmDialog from "@/components/utility/ConfirmDialog";
import { useDeleteTeam } from "@/hooks/team/useDeleteTeam";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { useDeleteTeamStore } from "@/store/team/useDeleteTeamStore";

export default function DeleteTeamDialog() {
    const { team, close } = useDeleteTeamStore();
    const selectedTeam = usePlaygroundNavStore((s) => s.selectedTeam);
    const clearTeam = usePlaygroundNavStore((s) => s.clearTeam);
    const deleteTeam = useDeleteTeam();

    function dismiss() {
        close();
        deleteTeam.reset();
    }

    function confirmDelete() {
        if (!team) return;
        deleteTeam.mutate(team.id, {
            onSuccess: () => {
                if (selectedTeam?.id === team.id) clearTeam();
                close();
            },
        });
    }

    return (
        <ConfirmDialog
            open={team !== null}
            onOpenChange={(next) => !next && dismiss()}
            title="Delete team?"
            description={
                <>
                    This permanently deletes{" "}
                    <span className="font-medium text-neutral-200">{team?.name}</span> along with
                    its member list and any pending invites. People lose access immediately and this
                    can&apos;t be undone.
                </>
            }
            cancel={{ label: "Cancel", variant: "tertiary", onClick: dismiss }}
            confirm={{ label: "Delete", variant: "destructive", onClick: confirmDelete }}
            pending={deleteTeam.isPending}
            typeToConfirm={team ? `@${team.slug}` : undefined}
            error={deleteTeam.isError ? "Couldn't delete the team. Try again." : undefined}
        />
    );
}
