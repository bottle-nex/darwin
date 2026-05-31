"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type Transition } from "motion/react";
import { HiBars3, HiChevronRight, HiXMark } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import AppLogo from "@/components/app/Applogo";
import ThemeToggle from "@/components/theme/ThemeToggle";

const menuEase: Transition["ease"] = [0.22, 1, 0.36, 1];

const NAV_ITEMS = [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "About", href: "/#about" },
];

const ROUTES = {
    login: "/login",
};

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
                <nav className={cn}>
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="text-[14px] font-medium text-foreground/70 hover:text-foreground transition-colors duration-200"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <Button className="flex items-center justify-center">
                        <Link href={ROUTES.login}>
                            Sign in
                            <HiChevronRight className="h-3 w-3" />
                        </Link>
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

            <AnimatePresence initial={false}>
                {menuOpen && (
                    <motion.div
                        key="mobile-menu"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: menuEase }}
                        className="md:hidden overflow-hidden border-b border-border bg-snow"
                    >
                        <nav className="mx-auto flex max-w-6xl flex-col px-4 py-2">
                            {NAV_ITEMS.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={() => setMenuOpen(false)}
                                    className="rounded-md px-2 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-secondary/60 hover:text-foreground"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
