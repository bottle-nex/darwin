"use client";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteTeam } from "@/hooks/team/useDeleteTeam";
import { useDeleteTeamStore } from "@/store/team/useDeleteTeamStore";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";

export default function DeleteTeamDialog() {
    const { team, close } = useDeleteTeamStore();
    const surface = usePlaygroundNavStore((s) => s.surface);
    const selectedTeam = usePlaygroundNavStore((s) => s.selectedTeam);
    const clearTeam = usePlaygroundNavStore((s) => s.clearTeam);
    const deleteTeam = useDeleteTeam();

    function handleOpenChange(next: boolean) {
        if (!next) {
            close();
            deleteTeam.reset();
        }
    }

    function confirmDelete() {
        if (!team) return;
        deleteTeam.mutate(team.id, {
            onSuccess: () => {
                if (selectedTeam?.id === team.id) {
                    clearTeam(surface);
                }
                close();
            },
        });
    }

    return (
        <Dialog open={team !== null} onOpenChange={handleOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="border-white/10 bg-charcoal sm:max-w-md"
            >
                <DialogHeader className="gap-1.5">
                    <DialogTitle className="text-base text-neutral-100">Delete team?</DialogTitle>
                    <DialogDescription className="text-[13px] text-neutral-400">
                        Deleting <span className="font-medium text-neutral-200">{team?.name}</span>{" "}
                        is permanent, you can&apos;t revert this.
                    </DialogDescription>
                </DialogHeader>

                {deleteTeam.isError && (
                    <p className="text-[12px] text-red-400">
                        Couldn&apos;t delete the team. Try again.
                    </p>
                )}

                <div className="mt-2 flex justify-end gap-2">
                    <Button
                        variant="tertiary"
                        size="sm"
                        onClick={() => handleOpenChange(false)}
                        disabled={deleteTeam.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        loading={deleteTeam.isPending}
                        onClick={confirmDelete}
                    >
                        Delete
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
