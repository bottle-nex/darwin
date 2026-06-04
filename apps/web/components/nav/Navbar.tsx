"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { azeretMono, Button } from "@/components/ui/button";
import AppLogo from "@/components/app/Applogo";
import { FaDiscord, FaPhoneAlt } from "react-icons/fa";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import SigninModal from "../utility/modal/SigninModal";
import { PiArrowRight } from "react-icons/pi";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
    { label: "Why", href: "/why" },
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "About", href: "/#about" },
];

export function NavBar({ isMarkettingPage = false }: { isMarkettingPage?: boolean }) {
    const setOpenSigninModal = useUserSessionStore((s) => s.setOpenSigninModal);
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
        setOpenSigninModal(true);
    }

    function handleRedirect() {
        router.push("/playground");
    }

    return (
        <header
            ref={headerRef}
            className={cn(
                "fixed top-0 left-0 right-0 z-50",
                "transition-[height,border-color] duration-300 ease-out",
                scrolled
                    ? isMarkettingPage
                        ? "border-b border-neutral-800 h-15 bg-charcoal"
                        : "border-b border-neutral-200 h-15 bg-snow"
                    : "border-b border-transparent h-17",
            )}
        >
            <div className="mx-auto max-w-7xl flex h-full items-center justify-between px-4">
                <div className="flex items-center gap-8 justify-between">
                    <Link href="/" aria-label="try matcha home">
                        <AppLogo className={isMarkettingPage ? "text-neutral-100" : ""} />
                    </Link>
                </div>
                <nav className={cn("flex items-center gap-x-24 ml-12")}>
                    <section className="hidden md:flex items-center gap-x-8 uppercase">
                        {NAV_ITEMS.map((item, i) => (
                            <div key={item.label} className="flex items-center gap-x-8">
                                {i > 0 && <span className="h-2.5 w-px bg-neutral-400" />}
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center text-[13px] font-medium transition-colors duration-200",
                                        isMarkettingPage
                                            ? "text-neutral-100 hover:text-neutral-100/70"
                                            : "text-foreground hover:text-foreground/70",
                                    )}
                                >
                                    {item.label}
                                </Link>
                            </div>
                        ))}
                    </section>
                    <section className="flex">
                        <FaDiscord className={cn(isMarkettingPage ? "text-neutral-200" : "")} />
                        <PiArrowRight className="-rotate-45 ml-1 size-4 text-indigo-600" />
                    </section>
                </nav>

                <div className="flex items-center gap-2">
                    <Button
                        variant={isMarkettingPage ? "tertiary" : "secondary"}
                        className="flex items-center justify-center"
                        onClick={session ? handleRedirect : handleSignin}
                    >
                        Connect with us
                        <FaPhoneAlt className="size-3" />
                    </Button>
                    <Button
                        className="flex items-center justify-center"
                        onClick={session ? handleRedirect : handleSignin}
                    >
                        {session ? "Get Started" : "Sign in"}
                        <PiArrowRight className="h-3 w-3" />
                    </Button>
                </div>
            </div>
            <SigninModal />
        </header>
    );
}
