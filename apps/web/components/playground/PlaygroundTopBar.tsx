"use client";
import { Plus, Search } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import PlaygroundOrgSwitcher from "./PlaygroundOrgSwitcher";

export default function PlaygroundTopBar() {
    const session = useUserSessionStore((s) => s.session);

    return (
        <header className="relative flex h-11 shrink-0 items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-1">
                <PlaygroundOrgSwitcher />
            </div>

            {/* search — absolutely centered so a long org name never shifts it */}
            <div className="absolute left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2">
                <Search
                    className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-neutral-500"
                    aria-hidden
                />
                <Input
                    placeholder="Search"
                    className="h-7 w-full rounded-md border-white/5 bg-white/5 pl-8 text-[12px] text-neutral-100 placeholder:text-neutral-500"
                />
                <kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[11px] text-neutral-500">
                    /
                </kbd>
            </div>

            {/* right side icons */}
            <div className="flex items-center gap-2.5">
                <Button
                    size="sm"
                    className="h-6.75 cursor-pointer gap-1 rounded-sm bg-neutral-100 px-2.5 text-[11px] font-medium text-neutral-900 hover:bg-white"
                >
                    <Plus className="size-3.5" aria-hidden />
                    Create
                </Button>
                <div className="relative h-7 w-7 overflow-hidden rounded-full">
                    {session?.user?.image && (
                        <Image
                            src={session.user.image}
                            alt=""
                            className="object-cover"
                            fill
                            unoptimized
                        />
                    )}
                </div>
            </div>
        </header>
    );
}
