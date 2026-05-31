"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { HiBars3, HiChevronRight, HiXMark } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { azeretMono, Button } from "@/components/ui/button";
import AppLogo from "@/components/app/Applogo";


const NAV_ITEMS = [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "About", href: "/#about" },
];
export function NavBar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const headerRef = useRef<HTMLElement>(null);

    return (
        <header
            ref={headerRef}
            className={cn(
                "fixed top-0 left-0 right-0 z-50 h-14",
                "border-b",
                "transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                scrolled ? "border-b-transparent bg-transparent" : "border-b-border bg-snow",
            )}
        >
            <div
                className={cn(
                    "mx-auto flex items-center justify-between px-4 border",
                    "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    scrolled
                        ? "mt-1.5 h-14 max-w-270 rounded-lg border-border bg-card shadow-[0_4px_16px_-4px_rgba(15,23,42,0.12)]"
                        : "h-full max-w-6xl rounded-none border-transparent bg-transparent shadow-none",
                )}
            >
                <div className="flex items-center gap-8 justify-between">
                    <Link href="/" aria-label="try matcha home">
                        <AppLogo />
                    </Link>
                </div>
                <nav className={cn("hidden md:flex items-center gap-7 uppercase", azeretMono.className)}>
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="text-[13px] font-medium text-foreground hover:text-foreground transition-colors duration-200"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="flex items-center gap-2">
                    <Button variant={"secondary"} className="flex items-center justify-center">
                        Sign in
                        <HiChevronRight className="h-3 w-3" />
                    </Button>
                    <Button className="flex items-center justify-center">
                        Get Started
                        <HiChevronRight className="h-3 w-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((open) => !open)}
                        className="md:hidden text-foreground/70"
                    >
                        {menuOpen ? <HiXMark className="size-5" /> : <HiBars3 className="size-5" />}
                    </Button>
                </div>
            </div>
        </header >
    );
}
