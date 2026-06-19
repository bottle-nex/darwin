"use client";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import Image from "next/image";
import { PiDotsThreeOutlineVerticalLight } from "react-icons/pi";
import { DropdownMenu } from "radix-ui";
import { MdVerifiedUser, MdPersonOff, MdKeyboardArrowRight } from "react-icons/md";
import axios from "axios";
import { CHANGE_MEMBER_AUTHORITY, REMOVE_MEMBERS } from "@/routes/api_routes";
import { TeamRole } from "@trymatcha/types";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import { useQueryClient } from "@tanstack/react-query";
import { TEAM_MEMBERS_QUERY_KEY } from "@/hooks/team/useGetTeamMembers";

const ITEM =
    "flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-[12.5px] text-neutral-300 outline-none select-none data-highlighted:bg-white/5 data-highlighted:text-neutral-100";

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
                <DropdownMenu.Root modal={false}>
                    <DropdownMenu.Trigger asChild>
                        <div className="absolute z-10 right-0 p-1 rounded-sm bg-linear-to-bl from-black/50 to-transparent cursor-pointer">
                            <PiDotsThreeOutlineVerticalLight />
                        </div>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                        <DropdownMenu.Content
                            align="end"
                            sideOffset={6}
                            className="z-50 w-52 origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-xl border border-white/10 bg-linear-to-b from-charcoal to-[#101010] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.07)] ring-1 ring-black/40 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                        >
                            <div className="p-1">
                                <DropdownMenu.Sub>
                                    <DropdownMenu.SubTrigger
                                        className={cn(ITEM, "justify-between")}
                                    >
                                        <span className="flex items-center gap-2.5">
                                            <MdVerifiedUser
                                                className="size-4 text-neutral-400"
                                                aria-hidden
                                            />
                                            Change authority
                                        </span>
                                        <MdKeyboardArrowRight
                                            className="size-3.5 text-neutral-500"
                                            aria-hidden
                                        />
                                    </DropdownMenu.SubTrigger>
                                    <DropdownMenu.Portal>
                                        <DropdownMenu.SubContent
                                            sideOffset={6}
                                            className="z-50 w-40 origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-xl border border-white/10 bg-linear-to-b from-charcoal to-[#101010] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.07)] ring-1 ring-black/40 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                                        >
                                            <div className="p-1">
                                                {Object.values(TeamRole).map((r) => (
                                                    <DropdownMenu.Item
                                                        key={r}
                                                        className={ITEM}
                                                        onClick={() => handleChangeAuthority(r)}
                                                    >
                                                        {r}
                                                    </DropdownMenu.Item>
                                                ))}
                                            </div>
                                        </DropdownMenu.SubContent>
                                    </DropdownMenu.Portal>
                                </DropdownMenu.Sub>
                            </div>
                            <DropdownMenu.Separator className="h-0.5 bg-[#0F0F0F] shadow-xs shadow-white/4" />
                            <div className="p-1">
                                <DropdownMenu.Item
                                    className={cn(
                                        ITEM,
                                        "text-neutral-300 data-highlighted:bg-red-500/10 data-highlighted:text-red-300 group",
                                    )}
                                    onClick={handleKick}
                                >
                                    <MdPersonOff
                                        className="size-4 text-neutral-400 group-hover:text-red-300"
                                        aria-hidden
                                    />
                                    Kick
                                </DropdownMenu.Item>
                            </div>
                        </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                </DropdownMenu.Root>
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
                {/* <DropdownMenu.Separator className="h-0.5 bg-[#0F0F0F] shadow-xs shadow-white/4" /> */}
            </div>
        </div>
    );
}
