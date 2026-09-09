"use client";
import { DeleteIcon, InviteMemberIcon } from "@trydarwin/ui/icons";
import { useParams } from "next/navigation";
import { useState } from "react";

import PlaygroundBreadcrumb from "@/components/playground/Core/components/PlaygroundBreadcrumb";
import {
    PaneActionsSlot,
    PaneLeadSlot,
} from "@/components/playground/Core/components/PlaygroundPaneSlots";
import InviteToTeamDialog from "@/components/team/InviteToTeamDialog";
import { Button } from "@/components/ui/button";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import useInviteTeamMember from "@/hooks/invitations/useInviteTeamMember";
import { useGetTeamMembers } from "@/hooks/team/useGetTeamMembers";
import { toast } from "@/lib/toast";
import { useDeleteTeamStore } from "@/store/team/useDeleteTeamStore";
import type { ProjectTeam } from "@/types/project";

import OptionButton from "../../Home/KanbanDisplay/OptionsBar/KanbanOptionPanels/OptionButton";
import MembersSelectionBar from "./MembersSelectionBar";
import RemoveMembersDialog from "./RemoveMembersDialog";
import RevokeInvitesDialog from "./RevokeInvitesDialog";
import PlaygroundTeamMembers from "./TeamMembers";

type PlaygroundTeamViewProps = {
    team: ProjectTeam;
};

export default function PlaygroundTeamViewMain({ team }: PlaygroundTeamViewProps) {
    const requestDelete = useDeleteTeamStore((s) => s.requestDelete);

    const { orgSlug, projectSlug } = useParams<{ orgSlug: string; projectSlug?: string }>();
    const { data: dashboard } = useGetDashboard(orgSlug);
    const activeProject = dashboard?.projects.find((p) => p.slug === projectSlug);

    const { data: teamData } = useGetTeamMembers(team.id);
    const isAdmin = teamData?.viewerRole === "Admin";

    const [inviteOpen, setInviteOpen] = useState<boolean>(false);
    const invite = useInviteTeamMember();

    return (
        <div className="relative flex min-h-0 flex-1 flex-col">
            <PaneLeadSlot>
                <PlaygroundBreadcrumb trail={[{ label: team.name, icon: team.icon }]} />
            </PaneLeadSlot>

            <PaneActionsSlot>
                <div className="flex shrink-0 items-center gap-1.5">
                    {isAdmin && (
                        <OptionButton
                            icon={InviteMemberIcon}
                            label="add user"
                            onClick={() => setInviteOpen(true)}
                        />
                    )}

                    <TooltipComponent content="Delete team">
                        <Button
                            variant="unstyled"
                            type="button"
                            onClick={() => requestDelete(team)}
                            aria-label="Delete team"
                            className="flex size-7 cursor-pointer items-center justify-center rounded-md text-neutral-400 hover:bg-overlay/5 hover:text-danger"
                        >
                            <DeleteIcon className="size-4" aria-hidden />
                        </Button>
                    </TooltipComponent>
                </div>
            </PaneActionsSlot>

            <PlaygroundTeamMembers teamId={team.id} />

            <MembersSelectionBar teamId={team.id} />

            <RemoveMembersDialog
                teamId={team.id}
                teamName={team.name}
                orgId={dashboard?.org.id}
                orgName={dashboard?.org.name ?? "this organization"}
            />
            <RevokeInvitesDialog teamId={team.id} />

            <InviteToTeamDialog
                open={inviteOpen}
                onOpenChange={setInviteOpen}
                orgName={dashboard?.org.name ?? ""}
                projectId={activeProject?.id ?? ""}
                teamName={team.name}
                teamMemberIds={teamData?.members.map((member) => member.user.id) ?? []}
                onSubmit={({ emails, userIds, role, message }) => {
                    if (!dashboard?.org.id || !activeProject?.id) return;
                    invite.mutate(
                        {
                            emails,
                            userIds,
                            message,
                            role,
                            orgId: dashboard.org.id,
                            projectId: activeProject.id,
                            teamId: team.id,
                        },
                        {
                            onSuccess: ({ added, invited, failed }) => {
                                if (added.length) {
                                    toast.success(
                                        `Added ${added.length} ${
                                            added.length === 1 ? "person" : "people"
                                        } to ${team.name}`,
                                    );
                                }
                                if (invited.length) {
                                    toast.success(
                                        `Invited ${invited.length} ${
                                            invited.length === 1 ? "person" : "people"
                                        }`,
                                    );
                                }
                                if (failed.length) {
                                    toast.warning(
                                        `Skipped ${failed.length}: ${failed
                                            .map(
                                                (f) =>
                                                    `${f.email ?? "project member"} (${f.reason.replace(/_/g, " ")})`,
                                            )
                                            .join(", ")}`,
                                    );
                                }
                                if (!added.length && !invited.length && !failed.length) {
                                    toast.info("No members were added");
                                }
                                setInviteOpen(false);
                            },
                            onError: () => toast.error("Couldn't send invites. Please try again."),
                        },
                    );
                }}
                isPending={invite.isPending}
            />
        </div>
    );
}
