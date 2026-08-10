"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import AppLogo from "@/components/app/Applogo";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
    { label: "Why", href: "/why" },
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "About", href: "/about" },
];

export function LandingNavbar({ isMarkettingPage = false }: { isMarkettingPage?: boolean }) {
    const router = useRouter();
    const session = useUserSessionStore((s) => s.session);
    const [scrolled, setScrolled] = useState(false);
    const headerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        function onScroll() {
            const scrollY = window.scrollY;
            setScrolled(scrollY > 10);
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
            ref={headerRef}
            className={cn(
                "fixed top-0 left-0 right-0 z-50",
                "transition-[height,border-color] duration-300 ease-out z-100",
                scrolled
                    ? isMarkettingPage
                        ? "border-b border-neutral-800 h-15 bg-ink"
                        : "border-b border-neutral-200 h-15 bg-snow"
                    : "border-b border-transparent h-17",
            )}
        >
            <div className="mx-auto max-w-5xl flex h-full items-center justify-between">
                <Link href="/" aria-label="try matcha home">
                    <AppLogo
                        size={20}
                        iconOnly
                        className={isMarkettingPage ? "text-neutral-100" : ""}
                    />
                </Link>

                <div className="flex items-center gap-x-6 lg:gap-x-8">
                    <nav className="hidden md:flex items-center gap-x-6 lg:gap-x-10">
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={cn(
                                    "text-[13px] font-medium text-foreground/65 hover:text-foreground transition-colors duration-200",
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <button
                        className="bg-[#1e1c28] text-[#f0eff8] px-4 py-1.75 font-medium rounded-md cursor-pointer text-[13px]"
                        onClick={session ? handleRedirect : handleSignin}
                    >
                        {session ? "Get Started" : "Sign in"}
                    </button>
                </div>
            </div>
        </header>
    );
}
