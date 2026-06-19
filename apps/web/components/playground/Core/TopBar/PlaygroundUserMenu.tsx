"use client";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { DropdownMenu } from "radix-ui";
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
import { cn } from "@/lib/utils";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import { useFetchOrganizations } from "@/hooks/playground/useFetchOrganizations";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import SessionServices from "@/lib/session";

const ITEM =
    "flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-[12.5px] text-neutral-300 outline-none select-none data-highlighted:bg-white/5 data-highlighted:text-neutral-100";

const PANEL =
    "z-50 origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-xl border border-white/10 bg-linear-to-b from-charcoal to-[#101010] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.07)] ring-1 ring-black/40 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95";

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
        <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className={cn(ITEM, "justify-between")}>
                <span className="flex min-w-0 items-center gap-2.5">
                    <PlaygroundAvatar letter={activeOrgInitial} tone="emerald" size="sm" />
                    <span className="truncate">{activeOrgName}</span>
                </span>
                <MdKeyboardArrowRight className="size-3.5 text-neutral-500" aria-hidden />
            </DropdownMenu.SubTrigger>

            <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                    sideOffset={6}
                    className={cn(PANEL, "max-h-80 w-60 overflow-y-auto p-1")}
                >
                    <DropdownMenu.Label className="px-2 py-1.5 text-[11px] font-medium tracking-wide text-neutral-500 uppercase">
                        Organizations
                    </DropdownMenu.Label>

                    {orgs.length === 0 ? (
                        <div className="px-3 py-2 text-[12px] text-neutral-500">
                            No organizations
                        </div>
                    ) : (
                        orgs.map((org) => (
                            <DropdownMenu.Item
                                key={org.id}
                                onSelect={() => router.push(`/playground/${org.slug}`)}
                                className={ITEM}
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
                            </DropdownMenu.Item>
                        ))
                    )}
                </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
        </DropdownMenu.Sub>
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
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    type="button"
                    aria-label="Account menu"
                    className="relative size-7 cursor-pointer overflow-hidden rounded-full outline-none ring-1 ring-white/10 transition hover:ring-white/25 data-[state=open]:ring-white/30"
                >
                    {user?.image ? (
                        <Image src={user.image} alt="" fill unoptimized className="object-cover" />
                    ) : (
                        <PlaygroundAvatar
                            size="xl"
                            tone="dark"
                            letter={initial}
                            className="h-full w-full rounded-full"
                        />
                    )}
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content align="end" sideOffset={8} className={cn(PANEL, "w-66")}>
                    <div className="flex items-center gap-3 px-3.5 py-3">
                        <span className="relative size-9 shrink-0 overflow-hidden rounded-xl shadow-sm ring-1 ring-white/15">
                            {user?.image ? (
                                <Image
                                    src={user.image}
                                    alt=""
                                    fill
                                    unoptimized
                                    className="object-cover"
                                />
                            ) : (
                                <PlaygroundAvatar
                                    size="xl"
                                    tone="dark"
                                    letter={initial}
                                    className="h-full w-full rounded-lg"
                                />
                            )}
                        </span>
                        <div className="min-w-0">
                            <p className="truncate text-[12px] font-semibold text-neutral-100">
                                {SessionServices.get_user()?.name}
                            </p>
                            <p className="truncate text-[12px] text-neutral-500">{handle}</p>
                        </div>
                    </div>

                    <DropdownMenu.Separator className="h-0.5 bg-[#0F0F0F] shadow-xs shadow-white/4" />

                    <div className="p-1">
                        {MENU_ITEMS.map((item) => (
                            <DropdownMenu.Item key={item.id} className={ITEM}>
                                <item.icon className="size-4 text-neutral-400" aria-hidden />
                                {item.label}
                            </DropdownMenu.Item>
                        ))}

                        <OrgSwitcherSubMenu />
                    </div>

                    <DropdownMenu.Separator className="h-0.5 bg-[#0F0F0F] shadow-xs shadow-white/4" />

                    <div className="p-1">
                        <DropdownMenu.Item
                            onSelect={() => signOut({ callbackUrl: "/" })}
                            className={cn(
                                ITEM,
                                "text-neutral-300 data-highlighted:bg-red-500/10 data-highlighted:text-red-300 group",
                            )}
                        >
                            <MdLogout
                                className="size-4 text-neutral-400 group-hover:text-red-300"
                                aria-hidden
                            />
                            Logout
                        </DropdownMenu.Item>
                    </div>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
