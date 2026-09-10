"use client";
import {
    type AnimatedIcon,
    DropdownCaretIcon,
    MarketingBriefcaseIcon,
    MarketingChecklistIcon,
    MarketingNoteIcon,
    MarketingPeopleIcon,
    NavCtaArrowIcon,
} from "@trydarwin/ui/icons";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import AppLogo from "@/components/app/Applogo";
import { cn } from "@/lib/utils";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";

import { landingContainer } from "../landing/LandingSection";

const MotionLink = motion.create(Link);

type NavLink = { label: string; href: string };
type NavMenuLink = NavLink & { description: string; meta: string; icon: AnimatedIcon };
type NavMenuUpcoming = { label: string; description: string; icon: AnimatedIcon };
type NavMenu = {
    label: string;
    groupLabel: string;
    links: NavMenuLink[];
    upcoming: NavMenuUpcoming[];
};
type NavItem = NavLink | NavMenu;

function isNavMenu(item: NavItem): item is NavMenu {
    return "links" in item;
}

const NAV_ITEMS: NavItem[] = [
    { label: "Why", href: "/why" },
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    {
        label: "Resources",
        groupLabel: "All resources",
        links: [
            {
                label: "About",
                href: "/about",
                description: "The people building darwin, and why we started it.",
                meta: "THE TEAM",
                icon: MarketingPeopleIcon,
            },
            {
                label: "Blog",
                href: "/blog?tab=blogs",
                description: "Notes on agents, code runners, and shipping software.",
                meta: "NOTES & WRITING",
                icon: MarketingNoteIcon,
            },
            {
                label: "Changelog",
                href: "/blog?tab=changelog",
                description: "Every release, week by week, with what changed and why.",
                meta: "SHIPPED WEEKLY",
                icon: MarketingChecklistIcon,
            },
        ],
        upcoming: [
            {
                label: "Integrations",
                description: "Connect darwin to GitHub, Slack, and the rest of your stack.",
                icon: MarketingBriefcaseIcon,
            },
        ],
    },
];

const NAV_LINK_CLASS =
    "text-[13px] font-normal text-muted-foreground hover:text-foreground transition-colors duration-200";

const REVEAL: Variants = {
    hidden: { opacity: 0, y: -8, filter: "blur(8px)" },
    show: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 },
    },
};

export function LandingNavbar() {
    const router = useRouter();
    const session = useUserSessionStore((s) => s.session);
    const [scrolled, setScrolled] = useState(false);
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const headerRef = useRef<HTMLElement>(null);
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        function onScroll() {
            const scrollY = window.scrollY;
            setScrolled(scrollY > 10);
        }

        document.addEventListener("scroll", onScroll, { passive: true });
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
            onMouseLeave={() => setOpenMenu(null)}
            onKeyDown={(e) => e.key === "Escape" && setOpenMenu(null)}
            className={cn(
                "fixed top-0 left-0 right-0 z-50",
                "transition-[height,border-color] duration-300 ease-out z-100",
                scrolled ? "h-15" : "h-17",
                scrolled
                    ? "border-b border-edge bg-cement shadow-[0_1px_2px_rgba(24,24,27,0.05)]"
                    : "border-b border-transparent",
            )}
        >
            <motion.div
                initial={reduceMotion ? false : "hidden"}
                animate="show"
                variants={REVEAL}
                className={cn(landingContainer, "flex h-full items-center justify-between")}
            >
                <div className="flex items-center gap-x-6 lg:gap-x-8">
                    <Link href="/" aria-label="try darwin home" className="text-foreground">
                        <AppLogo size={20} iconOnly />
                    </Link>

                    <nav className="hidden md:flex items-center gap-x-6 lg:gap-x-8">
                        {NAV_ITEMS.map((item) =>
                            isNavMenu(item) ? (
                                <div key={item.label} className="relative">
                                    <button
                                        type="button"
                                        aria-haspopup="true"
                                        aria-expanded={openMenu === item.label}
                                        onMouseEnter={() => setOpenMenu(item.label)}
                                        onFocus={() => setOpenMenu(item.label)}
                                        onClick={() =>
                                            setOpenMenu(openMenu === item.label ? null : item.label)
                                        }
                                        className={cn(
                                            NAV_LINK_CLASS,
                                            "flex items-center gap-x-1.5 cursor-pointer rounded-full px-3 py-1.5 -mx-3",
                                            openMenu === item.label && "bg-hover text-foreground",
                                        )}
                                    >
                                        {item.label}
                                        <DropdownCaretIcon
                                            className={cn(
                                                "size-2.5 transition-transform duration-200 motion-reduce:transition-none",
                                                openMenu === item.label && "rotate-180",
                                            )}
                                        />
                                    </button>

                                    <AnimatePresence initial={false}>
                                        {openMenu === item.label && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                                transition={{
                                                    duration: reduceMotion ? 0 : 0.22,
                                                    ease: [0.22, 1, 0.36, 1],
                                                }}
                                                className="absolute right-0 top-full mt-2.5 w-64 origin-top overflow-hidden rounded-sm bg-graphite shadow-[0_12px_32px_-12px_rgba(24,24,27,0.18)] border border-edge"
                                            >
                                                <p className="border-b border-edge px-3 py-2 text-[11.5px] text-muted-foreground">
                                                    {item.groupLabel}
                                                </p>

                                                <div className="flex flex-col p-1">
                                                    {item.links.map((link) => (
                                                        <MotionLink
                                                            key={link.label}
                                                            href={link.href}
                                                            onClick={() => setOpenMenu(null)}
                                                            initial="rest"
                                                            whileHover="hover"
                                                            className="group flex items-start gap-x-2.5 rounded-[6px] p-2 hover:bg-hover"
                                                        >
                                                            <span className="flex size-7 shrink-0 items-center justify-center rounded-[5px] border border-edge bg-mist text-muted-foreground">
                                                                <link.icon className="size-4" />
                                                            </span>
                                                            <span className="flex flex-col gap-y-0.5">
                                                                <span className="text-[12.5px] font-medium text-foreground">
                                                                    {link.label}
                                                                </span>
                                                                <span className="text-[11.5px] leading-snug text-muted-foreground">
                                                                    {link.description}
                                                                </span>
                                                                <span className="mt-1 font-mono text-[9.5px] tracking-[0.08em] text-muted-foreground/70">
                                                                    {link.meta}
                                                                </span>
                                                            </span>
                                                        </MotionLink>
                                                    ))}
                                                </div>

                                                <div className="flex flex-col border-t border-edge p-1">
                                                    {item.upcoming.map((entry) => (
                                                        <div
                                                            key={entry.label}
                                                            className="flex items-start gap-x-2.5 p-2"
                                                        >
                                                            <span className="flex size-7 shrink-0 items-center justify-center rounded-[5px] border border-edge bg-mist text-muted-foreground/70">
                                                                <entry.icon className="size-4" />
                                                            </span>
                                                            <span className="flex flex-col gap-y-0.5">
                                                                <span className="flex items-center gap-x-2">
                                                                    <span className="text-[12.5px] font-medium text-foreground">
                                                                        {entry.label}
                                                                    </span>
                                                                    <span className="rounded-full border border-edge px-1.5 py-px text-[10px] text-muted-foreground">
                                                                        Soon
                                                                    </span>
                                                                </span>
                                                                <span className="text-[11.5px] leading-snug text-muted-foreground">
                                                                    {entry.description}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onMouseEnter={() => setOpenMenu(null)}
                                    className={NAV_LINK_CLASS}
                                >
                                    {item.label}
                                </Link>
                            ),
                        )}
                    </nav>
                </div>

                <div className="flex items-center gap-x-3">
                    <Link
                        href="/blog?tab=changelog"
                        className="spin-ring inline-flex h-9 items-center rounded-full p-px shadow-[0_1px_2px_rgba(24,24,27,0.07)]"
                    >
                        <span className="inline-flex h-full items-center gap-x-3 rounded-full bg-snow px-4 text-[13px] font-medium text-foreground transition-colors hover:bg-mist">
                            See what&apos;s new
                            <NavCtaArrowIcon className="size-4 text-muted-foreground" />
                        </span>
                    </Link>

                    <button
                        type="button"
                        onClick={session ? handleRedirect : handleSignin}
                        className="inline-flex h-8 mb-1 cursor-pointer items-center rounded-[10px] border-[1px] border-b-0 border-edge bg-snow px-3.5 text-[13px] font-medium text-foreground shadow-[0_4px_0_0_#d7d7d9,0_6px_6px_-3px_rgba(24,24,27,0.2)] transition-all duration-150 hover:bg-mist focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none active:translate-y-0.5 active:shadow-[0_0_0_0_#e4e4e7,0_2px_4px_-3px_rgba(24,24,27,0.25)] active:border-b-[1px]"
                    >
                        Get Started
                    </button>
                </div>
            </motion.div>
        </header>
    );
}
