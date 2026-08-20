"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MdAdd, MdCheck, MdKeyboardArrowRight, MdLogout, MdSettings } from "react-icons/md";
import { type IconType } from "react-icons";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import { useFetchOrganizations } from "@/hooks/playground/useFetchOrganizations";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import SessionServices from "@/lib/session";
import CreateOrganizationModal from "@/components/playground/landing/CreateOrganizationModal";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import { SIDEBAR_ICON_BUTTON_CLASS } from "@/components/playground/Sidebar/shared";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { PlaygroundTab } from "@/components/playground/playgroundTabs";

const MENU_ITEMS: { id: string; label: string; icon: IconType }[] = [
    { id: "settings", label: "Settings", icon: MdSettings },
];

function OrgSwitcherSubMenu({ onCreateOrg }: { onCreateOrg: () => void }) {
    const router = useRouter();
    const { orgSlug } = useParams<{ orgSlug: string }>();
    const { data: organizations } = useFetchOrganizations();

    const orgs = organizations ?? [];
    const activeOrg = orgs.find((org) => org.slug === orgSlug);
    const activeOrgName = activeOrg?.name ?? orgSlug ?? "Workspace";
    const activeOrgInitial = activeOrgName.trim().charAt(0).toUpperCase() || "W";

    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger className="justify-between">
                <span className="flex min-w-0 items-center gap-2.5">
                    <PlaygroundAvatar letter={activeOrgInitial} tone="emerald" size="sm" />
                    <span className="truncate">{activeOrgName}</span>
                </span>
                <MdKeyboardArrowRight className="size-3.5 text-neutral-500" aria-hidden />
            </DropdownMenuSubTrigger>

            <DropdownMenuSubContent className="max-h-80 w-60 overflow-y-auto p-1">
                <DropdownMenuLabel>Organizations</DropdownMenuLabel>

                {orgs.length === 0 ? (
                    <div className="px-3 py-2 text-[12px] text-neutral-500">No organizations</div>
                ) : (
                    orgs.map((org) => (
                        <DropdownMenuItem
                            key={org.id}
                            onSelect={() => router.push(`/playground/${org.slug}`)}
                        >
                            <PlaygroundAvatar
                                letter={org.name.trim().charAt(0).toUpperCase()}
                                tone="emerald"
                                size="sm"
                            />
                            <span className="min-w-0 flex-1 truncate">{org.name}</span>
                            {org.slug === orgSlug && (
                                <MdCheck
                                    className="size-3.5 shrink-0 text-neutral-400"
                                    aria-hidden
                                />
                            )}
                        </DropdownMenuItem>
                    ))
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem onSelect={onCreateOrg}>
                    <MdAdd className="size-4 text-neutral-400" aria-hidden />
                    Create organization
                </DropdownMenuItem>
            </DropdownMenuSubContent>
        </DropdownMenuSub>
    );
}

export default function PlaygroundUserMenu() {
    const user = useUserSessionStore((s) => s.session?.user);
    const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
    const setTab = usePlaygroundNavStore((s) => s.setTab);

    function openSettings() {
        setTab(PlaygroundTab.SettingsAppearance);
    }

    const name = user?.name?.trim() || user?.email?.split("@")[0] || "User";
    const handle = `@${(user?.email?.split("@")[0] || name).toLowerCase().replace(/\s+/g, "")}`;
    const initial = name.charAt(0).toUpperCase();

    return (
        <>
            <div className="flex items-center gap-0.5">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="unstyled"
                            type="button"
                            aria-label="Account menu"
                            className="flex w-fit min-w-0 cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-white/5 data-[state=open]:bg-white/5"
                        >
                            {user?.image ? (
                                <span className="relative size-5 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
                                    <Image
                                        src={user.image}
                                        alt=""
                                        fill
                                        sizes="24px"
                                        className="object-cover"
                                    />
                                </span>
                            ) : (
                                <PlaygroundAvatar
                                    size="sm"
                                    tone="emerald"
                                    letter={initial}
                                    className="size-7 shrink-0 text-[12px]"
                                />
                            )}
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13px] font-medium text-neutral-200">
                                    {name}
                                </span>
                                {/*<span className="block truncate text-[11px] text-neutral-500">
                                {user?.email}
                            </span>*/}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="start" side="top" className="w-66">
                        <div className="flex items-center gap-3 px-3.5 py-3">
                            {user?.image ? (
                                <span className="relative size-9 shrink-0 overflow-hidden rounded-xl shadow-sm ring-1 ring-white/15">
                                    <Image
                                        src={user.image}
                                        alt=""
                                        fill
                                        sizes="36px"
                                        className="object-cover"
                                    />
                                </span>
                            ) : (
                                <PlaygroundAvatar size="md" tone="emerald" letter={initial} />
                            )}
                            <div className="min-w-0">
                                <p className="truncate text-[12px] font-semibold text-neutral-100">
                                    {SessionServices.get_user()?.name}
                                </p>
                                <p className="truncate text-[12px] text-neutral-500">{handle}</p>
                            </div>
                        </div>

                        <DropdownMenuSeparator />

                        <div className="p-1">
                            {MENU_ITEMS.map((item) => (
                                <DropdownMenuItem key={item.id} onSelect={openSettings}>
                                    <item.icon className="size-4 text-neutral-400" aria-hidden />
                                    {item.label}
                                </DropdownMenuItem>
                            ))}

                            <OrgSwitcherSubMenu onCreateOrg={() => setIsCreateOrgOpen(true)} />
                        </div>

                        <DropdownMenuSeparator />

                        <div className="p-1">
                            <DropdownMenuItem
                                onSelect={() => signOut({ callbackUrl: "/" })}
                                className="group"
                            >
                                <MdLogout
                                    className="size-4 text-neutral-400 group-hover:text-red-300"
                                    aria-hidden
                                />
                                Logout
                            </DropdownMenuItem>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="ml-auto flex shrink-0 items-center gap-0.5">
                    <TooltipComponent content="Settings" side="top" delayDuration={500}>
                        <Button
                            variant="unstyled"
                            type="button"
                            onClick={openSettings}
                            aria-label="Settings"
                            className={SIDEBAR_ICON_BUTTON_CLASS}
                        >
                            <MdSettings className="size-4" aria-hidden />
                        </Button>
                    </TooltipComponent>
                </div>
            </div>
            <CreateOrganizationModal open={isCreateOrgOpen} onOpenChange={setIsCreateOrgOpen} />
        </>
    );
}
