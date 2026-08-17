"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import AdminSession from "@/lib/session";

export default function AdminShell({
    children,
    email,
}: {
    children: ReactNode;
    email: string | null;
}) {
    const router = useRouter();

    function signOut() {
        AdminSession.clear();
        router.replace("/login");
        router.refresh();
    }

    return (
        <div className="flex min-h-dvh flex-col bg-ink">
            <header className="sticky top-0 z-40 border-b border-graphite bg-ink/85 backdrop-blur">
                <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
                    <Link
                        href="/"
                        className="font-mono text-[11px] tracking-[0.18em] text-mist/70 uppercase transition-colors hover:text-snow"
                    >
                        matcha admin
                    </Link>
                    <div className="flex items-center gap-x-4">
                        <span className="hidden text-[13px] text-mist/35 sm:block">{email}</span>
                        <Button variant="ghost" size="sm" onClick={signOut}>
                            Sign out
                        </Button>
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-24">{children}</main>
        </div>
    );
}
