"use client";
import { ProjectRole, TeamRole } from "@trymatcha/types";

import { CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import type { MemberCommandActions } from "@/hooks/team/useMemberCommandActions";
import type { MemberCommandPage } from "@/types/command.type";

export const MEMBER_PAGE_TITLE: Record<MemberCommandPage, string> = {
    "member-team-role": "Set team role",
    "member-project-role": "Set project role",
};

const TEAM_ROLE_HINT: Record<TeamRole, string> = {
    [TeamRole.Maintainer]: "Can add, remove and re-role people in this team",
    [TeamRole.Member]: "Can read the team and its secrets",
};

const PROJECT_ROLE_HINT: Record<ProjectRole, string> = {
    [ProjectRole.Admin]: "Full control of the project, its teams and members",
    [ProjectRole.Maintain]: "Can run the board and the agents, but not manage teams",
    [ProjectRole.Write]: "Can file and work issues",
    [ProjectRole.Triage]: "Can sort and assign issues, but not close them",
    [ProjectRole.Read]: "Can look, but not change anything",
};

export default function CommandMemberPage({
    page,
    actions,
    onDone,
}: {
    page: MemberCommandPage;
    actions: MemberCommandActions;
    onDone: () => void;
}) {
    if (!actions.count) return null;

    function pick(run: () => void) {
        run();
        onDone();
    }

    return (
        <CommandList data-lenis-prevent>
            <CommandEmpty>No matches.</CommandEmpty>

            {page === "member-team-role" && (
                <CommandGroup heading="Team role">
                    {Object.values(TeamRole).map((role) => (
                        <CommandItem
                            key={role}
                            value={role}
                            disabled={!actions.canSetTeamRole}
                            onSelect={() => pick(() => void actions.setTeamRole(role))}
                            className="justify-between"
                        >
                            {role}
                            <span className="truncate text-[11px] text-neutral-500">
                                {TEAM_ROLE_HINT[role]}
                            </span>
                        </CommandItem>
                    ))}
                </CommandGroup>
            )}

            {page === "member-project-role" && (
                <CommandGroup heading="Project role">
                    {Object.values(ProjectRole).map((role) => (
                        <CommandItem
                            key={role}
                            value={role}
                            disabled={!actions.canSetProjectRole}
                            onSelect={() => pick(() => void actions.setProjectRole(role))}
                            className="justify-between"
                        >
                            {role}
                            <span className="truncate text-[11px] text-neutral-500">
                                {PROJECT_ROLE_HINT[role]}
                            </span>
                        </CommandItem>
                    ))}
                </CommandGroup>
            )}
        </CommandList>
    );
}
