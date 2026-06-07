"use client";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { DropdownMenu } from "radix-ui";
import {
    FolderOpen,
    LayoutGrid,
    LogOut,
    Settings,
    UserRound,
    Users,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import SessionServices from "@/lib/session";

const ITEM =
    "flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-[12.5px] text-neutral-300 outline-none select-none data-highlighted:bg-white/5 data-highlighted:text-neutral-100";

const MENU_ITEMS: { id: string; label: string; icon: LucideIcon }[] = [
    { id: "personal", label: "Personal info", icon: UserRound },
    { id: "Projects", label: "Projects", icon: FolderOpen },
    { id: "Teams", label: "Teams", icon: LayoutGrid },
    { id: "organization", label: "Organization", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
];

/**
 * Account menu opened from the top-bar avatar: profile header, a workspace
 * switcher backed by the user's organizations, account links, and a working
 * logout (next-auth `signOut`).
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
                <DropdownMenu.Content
                    align="end"
                    sideOffset={8}
                    className="z-50 w-66 origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-xl border border-white/10 bg-linear-to-b from-charcoal to-[#101010] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.07)] ring-1 ring-black/40 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                >
                    {/* Profile header */}
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

                    {/* Account links */}
                    <div className="p-1">
                        {MENU_ITEMS.map((item) => (
                            <DropdownMenu.Item key={item.id} className={ITEM}>
                                <item.icon className="size-4 text-neutral-400" aria-hidden />
                                {item.label}
                            </DropdownMenu.Item>
                        ))}
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
                            <LogOut
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
