"use client";
import { useQueryClient } from "@tanstack/react-query";
import { TeamRole } from "@trydarwin/types";
import {
    ChangeRoleIcon,
    OverflowMenuVerticalIcon,
    RemoveMemberIcon,
    SubmenuDisclosureIcon,
} from "@trydarwin/ui/icons";
import axios from "axios";
import Image from "next/image";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TEAM_MEMBERS_QUERY_KEY } from "@/hooks/team/useGetTeamMembers";
import { cn } from "@/lib/utils";
import { CHANGE_MEMBER_AUTHORITY, REMOVE_MEMBERS } from "@/routes/api_routes";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";

import { Button } from "../ui/button";

interface ProfileCardProps {
    id: string;
    name: string;
    role: string;
    profilimage: string;
    teamId: string;
    orgId: string;
    banner?: string;
    issues?: {
        created?: number;
        fixed?: number;
        notAnswered?: number;
    };
}

export default function ProfileCard({
    id,
    name,
    role,
    profilimage,
    teamId,
    orgId,
    banner,
    issues,
}: ProfileCardProps) {
    const { session } = useUserSessionStore();
    const queryClient = useQueryClient();

    function handleMessageOnClick() {}

    async function handleChangeAuthority(role: TeamRole) {
        await axios.post(
            CHANGE_MEMBER_AUTHORITY,
            {
                teamId,
                memberId: id,
                role,
            },
            {
                headers: {
                    Authorization: `Bearer ${session?.user?.token}`,
                },
            },
        );
        queryClient.invalidateQueries({ queryKey: [...TEAM_MEMBERS_QUERY_KEY, teamId] });
    }

    async function handleKick() {
        await axios.post(
            REMOVE_MEMBERS,
            {
                orgId,
                teamId,
                userIds: [id],
            },
            {
                headers: {
                    Authorization: `Bearer ${session?.user?.token}`,
                },
            },
        );
        queryClient.invalidateQueries({ queryKey: [...TEAM_MEMBERS_QUERY_KEY, teamId] });
    }

    return (
        <div
            className={cn(
                "relative",
                "h-74 w-66 bg-charcoal ring ring-white/5 rounded-xl p-2",
                "flex flex-col justify-between items-center",
                "shadow-md",
            )}
        >
            <div className="relative h-28 w-full rounded-md overflow-hidden">
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <div className="absolute z-10 right-0 p-1 rounded-sm bg-linear-to-bl from-black/50 to-transparent cursor-pointer">
                            <OverflowMenuVerticalIcon />
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                        <div className="p-1">
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="justify-between">
                                    <span className="flex items-center gap-2.5">
                                        <ChangeRoleIcon
                                            className="size-4 text-neutral-400"
                                            aria-hidden
                                        />
                                        Change authority
                                    </span>
                                    <SubmenuDisclosureIcon
                                        className="size-3.5 text-neutral-500"
                                        aria-hidden
                                    />
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="w-40">
                                    <div className="p-1">
                                        {Object.values(TeamRole).map((r) => (
                                            <DropdownMenuItem
                                                key={r}

                                                onClick={() => handleChangeAuthority(r)}
                                            >
                                                {r}
                                            </DropdownMenuItem>
                                        ))}
                                    </div>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                        </div>
                        <DropdownMenuSeparator className="h-0.5 bg-[#0F0F0F] shadow-xs shadow-white/4" />
                        <div className="p-1">
                            <DropdownMenuItem className={"group"} onClick={handleKick}>
                                <RemoveMemberIcon
                                    className="size-4 text-neutral-400 group-hover:text-red-300"
                                    aria-hidden
                                />
                                Kick
                            </DropdownMenuItem>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Image
                    src={banner ?? "/images/ui/bugatti.png"}
                    fill
                    alt="banner"
                    className="object-cover"
                />
            </div>
            <div className="absolute top-23 left-5 bg-red size-14 rounded-full ring-2 ring-charcoal overflow-hidden ">
                {profilimage ? (
                    <Image src={profilimage} alt={name} fill className="object-cover" />
                ) : (
                    <div className="h-full w-full  bg-charcoal ">
                        <div className="h-full w-full bg-neutral-800/30 flex justify-center items-center">
                            {name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                )}
            </div>
            <div className="w-full flex flex-col justify-between gap-y-2 ">
                <div className="w-full flex flex-col leading-tight">
                    <div className="truncate ">{name}</div>
                    <div className="text-white/40 text-xs ">{role}</div>
                </div>
                <div className="flex h-11 w-full overflow-hidden rounded-md border border-white/5 bg-neutral-800/30">
                    <div className="flex flex-1 flex-col items-center justify-center">
                        <span className="text-[10px] text-neutral-500">Created</span>
                        <span className="text-xs font-medium text-white">
                            {issues?.created || 0}
                        </span>
                    </div>

                    <div className="w-px bg-white/5" />

                    <div className="flex flex-1 flex-col items-center justify-center">
                        <span className="text-[10px] text-neutral-500">Fixed</span>
                        <span className="text-xs font-medium text-white">{issues?.fixed || 0}</span>
                    </div>

                    <div className="w-px bg-white/5" />

                    <div className="flex flex-1 flex-col items-center justify-center">
                        <span className="text-[10px] text-neutral-500">Not Answered</span>
                        <span className="text-xs font-medium text-white">
                            {issues?.notAnswered || 0}
                        </span>
                    </div>
                </div>
                <Button
                    variant={"tertiary"}
                    type="button"
                    size={"default"}
                    // loading={connect.isPending}
                    onClick={handleMessageOnClick}
                    // disabled={connect.isPending}
                    className="rounded-md"
                >
                    Message
                </Button>
                {/* <DropdownMenuSeparator className="h-0.5 bg-[#0F0F0F] shadow-xs shadow-white/4" /> */}
            </div>
        </div>
    );
}
