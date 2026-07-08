"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDeleteTeam } from "@/hooks/team/useDeleteTeam";
import { useDeleteTeamStore } from "@/store/team/useDeleteTeamStore";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";

export default function DeleteTeamDialog() {
    const { team, close } = useDeleteTeamStore();
    const surface = usePlaygroundNavStore((s) => s.surface);
    const selectedTeam = usePlaygroundNavStore((s) => s.selectedTeam);
    const clearTeam = usePlaygroundNavStore((s) => s.clearTeam);
    const deleteTeam = useDeleteTeam();

    const [confirmText, setConfirmText] = useState("");

    const requiredText = team ? `@${team.slug}` : "";
    const canDelete = confirmText.trim() === requiredText;

    function handleOpenChange(next: boolean) {
        if (!next) {
            close();
            deleteTeam.reset();
            setConfirmText("");
        }
    }

    function confirmDelete() {
        if (!team || !canDelete) return;
        deleteTeam.mutate(team.id, {
            onSuccess: () => {
                if (selectedTeam?.id === team.id) {
                    clearTeam(surface);
                }
                close();
                setConfirmText("");
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
                        This permanently deletes{" "}
                        <span className="font-medium text-neutral-200">{team?.name} </span> along
                        with its member list and any pending invites. People lose access immediately
                        and this can&apos;t be undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-2">
                    <label htmlFor="delete-team-confirm" className="text-[13px] text-neutral-400">
                        To confirm, type{" "}
                        <span className="font-mono font-medium text-neutral-200">
                            {requiredText}
                        </span>{" "}
                        below.
                    </label>
                    <Input
                        id="delete-team-confirm"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && canDelete && !deleteTeam.isPending) {
                                confirmDelete();
                            }
                        }}
                        placeholder={requiredText}
                        autoComplete="off"
                        autoFocus
                        spellCheck={false}
                        aria-invalid={confirmText.length > 0 && !canDelete}
                    />
                </div>

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
                        disabled={!canDelete || deleteTeam.isPending}
                        onClick={confirmDelete}
                    >
                        Delete
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
