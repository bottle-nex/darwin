"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { MdDelete } from "react-icons/md";
import type { ProjectTeam } from "@/types/project";
import { useDeleteTeamStore } from "@/store/team/useDeleteTeamStore";
import { useGetDashboard } from "@/hooks/dashboard/useGetDashboard";
import { useGetTeamMembers } from "@/hooks/team/useGetTeamMembers";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import useInviteTeamMember from "@/hooks/invitations/useInviteTeamMember";
import InviteToTeamDialog from "@/components/team/InviteToTeamDialog";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import PlaygroundTeamMembers from "./TeamMembers";
import { Button } from "@/components/ui/button";
import { LuUserPlus } from "react-icons/lu";
import OptionButton from "../../Home/KanbanDisplay/OptionsBar/KanbanOptionPanels/OptionButton";

type PlaygroundTeamViewProps = {
    team: ProjectTeam;
};

export default function PlaygroundTeamViewMain({ team }: PlaygroundTeamViewProps) {
    const requestDelete = useDeleteTeamStore((s) => s.requestDelete);

    const { orgSlug, projectSlug } = useParams<{ orgSlug: string; projectSlug?: string }>();
    const { data: dashboard } = useGetDashboard(orgSlug);
    const activeProject = dashboard?.projects.find((p) => p.slug === projectSlug);
    const user = useUserSessionStore((s) => s.session?.user);

    const { data: teamData } = useGetTeamMembers(team.id);
    const isAdmin = teamData?.viewerRole === "Admin";

    const [inviteOpen, setInviteOpen] = useState<boolean>(false);
    const invite = useInviteTeamMember();

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-white/5 px-3">
                <div className="flex min-w-0 items-center gap-2">
                    <PlaygroundAvatar
                        size="md"
                        letter={team.name.trim().charAt(0).toUpperCase()}
                        tone="indigo"
                    />
                    <div className="flex min-w-0 items-baseline gap-1.5">
                        <h2 className="truncate text-[13px] font-semibold text-neutral-100">
                            {team.name}
                        </h2>
                        <p className="shrink-0 font-mono text-[11px] text-neutral-500">
                            @{team.slug}
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                    {isAdmin && (
                        <OptionButton
                            icon={LuUserPlus}
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
                            className="flex size-7 cursor-pointer items-center justify-center rounded-md text-neutral-400 hover:bg-white/5 hover:text-rose-300"
                        >
                            <MdDelete className="size-4" aria-hidden />
                        </Button>
                    </TooltipComponent>
                </div>
            </div>

            <PlaygroundTeamMembers teamId={team.id} />

            <InviteToTeamDialog
                open={inviteOpen}
                onOpenChange={setInviteOpen}
                sender={{ name: user?.name, email: user?.email, image: user?.image }}
                orgName={dashboard?.org.name ?? ""}
                projectName={activeProject?.name ?? ""}
                teamName={team.name}
                onSubmit={({ emails, role, message }) => {
                    if (!dashboard?.org.id || !activeProject?.id) return;
                    invite.mutate(
                        {
                            emails,
                            message,
                            role,
                            orgId: dashboard.org.id,
                            projectId: activeProject.id,
                            teamId: team.id,
                        },
                        {
                            onSuccess: ({ invited, failed }) => {
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
                                                    `${f.email} (${f.reason.replace(/_/g, " ")})`,
                                            )
                                            .join(", ")}`,
                                    );
                                }
                                if (!invited.length && !failed.length) {
                                    toast.info("No invitations were sent");
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
