"use client";
import { NavCtaArrowIcon, PhoneContactIcon } from "@trydarwin/ui/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AppLogo from "@/components/app/Applogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";

const NAV_ITEMS = [
    { label: "Why", href: "/why" },
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "About", href: "/about" },
];

export function AboutRevampNavBar() {
    const router = useRouter();
    const session = useUserSessionStore((s) => s.session);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        function onScroll() {
            setScrolled(window.scrollY > 10);
        }
        document.addEventListener("scroll", onScroll);
        return () => document.removeEventListener("scroll", onScroll);
    }, []);

    function handleSignin() {
        router.push("/login");
    }

    function handleRedirect() {
        router.push("/playground");
    }

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-100",
                "transition-[height,background-color,border-color] duration-300 ease-out",
                scrolled
                    ? "h-15 border-b border-white/10 bg-ink"
                    : "h-17 border-b border-transparent bg-transparent",
            )}
        >
            <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
                <Link href="/" aria-label="try darwin home" className="shrink-0">
                    <AppLogo size={20} />
                </Link>

                <nav className="ml-4 hidden items-center gap-x-8 md:flex lg:ml-12 lg:gap-x-24">
                    <section className="flex items-center gap-x-5 uppercase lg:gap-x-8">
                        {NAV_ITEMS.map((item, i) => (
                            <div key={item.label} className="flex items-center gap-x-5 lg:gap-x-8">
                                {i > 0 && <span className="h-2.5 w-px bg-neutral-700" />}
                                <Link
                                    href={item.href}
                                    className="flex items-center text-[13px] font-medium text-neutral-300 transition-colors duration-200 hover:text-neutral-100"
                                >
                                    {item.label}
                                </Link>
                            </div>
                        ))}
                    </section>
                </nav>

                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        className="hidden items-center justify-center lg:flex"
                        onClick={session ? handleRedirect : handleSignin}
                    >
                        Connect with us
                        <PhoneContactIcon className="size-3" />
                    </Button>
                    <Button
                        className="flex items-center justify-center"
                        onClick={session ? handleRedirect : handleSignin}
                    >
                        {session ? "Get Started" : "Sign in"}
                        <NavCtaArrowIcon className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
