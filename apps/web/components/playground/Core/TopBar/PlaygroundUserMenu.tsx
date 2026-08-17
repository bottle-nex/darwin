"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
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
import {
    MdCheck,
    MdFolderOpen,
    MdKeyboardArrowRight,
    MdLogout,
    MdPerson,
    MdSettings,
    MdWindow,
} from "react-icons/md";
import { type IconType } from "react-icons";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import { useFetchOrganizations } from "@/hooks/playground/useFetchOrganizations";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import SessionServices from "@/lib/session";

const MENU_ITEMS: { id: string; label: string; icon: IconType }[] = [
    { id: "personal", label: "Personal info", icon: MdPerson },
    { id: "Projects", label: "Projects", icon: MdFolderOpen },
    { id: "Teams", label: "Teams", icon: MdWindow },
    { id: "settings", label: "Settings", icon: MdSettings },
];

/** Submenu row showing the active organization and a flyout to switch between them. */
function OrgSwitcherSubMenu() {
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
                <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-medium tracking-wide text-neutral-500 uppercase">
                    Organizations
                </DropdownMenuLabel>

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
            </DropdownMenuSubContent>
        </DropdownMenuSub>
    );
}

/**
 * Account menu opened from the top-bar avatar: profile header, an organization
 * switcher submenu backed by the user's organizations, account links, and a
 * working logout (next-auth `signOut`).
 */
export default function PlaygroundUserMenu() {
    const user = useUserSessionStore((s) => s.session?.user);

    const name = user?.name?.trim() || user?.email?.split("@")[0] || "User";
    const handle = `@${(user?.email?.split("@")[0] || name).toLowerCase().replace(/\s+/g, "")}`;
    const initial = name.charAt(0).toUpperCase();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {user?.image ? (
                    <Button
                        variant="unstyled"
                        type="button"
                        aria-label="Account menu"
                        className="relative size-7 cursor-pointer overflow-hidden rounded-full outline-none ring-1 ring-white/10 transition hover:ring-white/25 data-[state=open]:ring-white/30"
                    >
                        <Image src={user.image} alt="" fill sizes="28px" className="object-cover" />
                    </Button>
                ) : (
                    <Button
                        variant="unstyled"
                        type="button"
                        aria-label="Account menu"
                        className="cursor-pointer"
                    >
                        <PlaygroundAvatar
                            size="sm"
                            tone="emerald"
                            letter={initial}
                            className="size-6.5 text-[12px]"
                        />
                    </Button>
                )}
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-66">
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
                        <PlaygroundAvatar
                            size="md"
                            tone="emerald"
                            letter={initial}
                            // className="size-9 text-[15px]"
                        />
                    )}
                    <div className="min-w-0">
                        <p className="truncate text-[12px] font-semibold text-neutral-100">
                            {SessionServices.get_user()?.name}
                        </p>
                        <p className="truncate text-[12px] text-neutral-500">{handle}</p>
                    </div>
                </div>

                <DropdownMenuSeparator className="h-0.5 bg-[#0F0F0F] shadow-xs shadow-white/4" />

                <div className="p-1">
                    {MENU_ITEMS.map((item) => (
                        <DropdownMenuItem key={item.id}>
                            <item.icon className="size-4 text-neutral-400" aria-hidden />
                            {item.label}
                        </DropdownMenuItem>
                    ))}

                    <OrgSwitcherSubMenu />
                </div>

                <DropdownMenuSeparator className="h-0.5 bg-[#0F0F0F] shadow-xs shadow-white/4" />

                <div className="p-1">
                    <DropdownMenuItem
                        onSelect={() => signOut({ callbackUrl: "/" })}
                        className={"group"}
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
    );
}
