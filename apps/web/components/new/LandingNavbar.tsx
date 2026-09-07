"use client";
import {
    type AnimatedIcon,
    CtaArrowIcon,
    DropdownCaretIcon,
    MarketingBriefcaseIcon,
    MarketingChecklistIcon,
    MarketingNoteIcon,
    MarketingPeopleIcon,
} from "@trymatcha/ui/icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import AppLogo from "@/components/app/Applogo";
import { cn } from "@/lib/utils";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";

import { landingContainer } from "../landing/LandingSection";
import { Button } from "../ui/button";

const MotionLink = motion.create(Link);

type NavLink = { label: string; href: string };
type NavMenuLink = NavLink & { description: string; icon: AnimatedIcon };
type NavMenu = { label: string; links: NavMenuLink[] };
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
        links: [
            {
                label: "About",
                href: "/about",
                description: "The team building matcha",
                icon: MarketingPeopleIcon,
            },
            {
                label: "Blog",
                href: "/blog?tab=blogs",
                description: "Notes on agents and shipping",
                icon: MarketingNoteIcon,
            },
            {
                label: "Changelog",
                href: "/blog?tab=changelog",
                description: "What shipped, week by week",
                icon: MarketingChecklistIcon,
            },
            {
                label: "Integrations",
                href: "#",
                description: "Connect matcha to your favorite tools",
                icon: MarketingBriefcaseIcon,
            },
        ],
    },
];

const NAV_LINK_CLASS =
    "text-[15px] font-normal text-mist/60 hover:text-snow transition-colors duration-200";

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
                scrolled ? "border-b border-graphite/10 bg-ink" : "border-b border-transparent",
            )}
        >
            <div className={cn(landingContainer, "flex h-full items-center justify-between")}>
                <Link href="/" aria-label="try matcha home" className="text-snow">
                    <AppLogo size={25} iconOnly />
                </Link>

                <div className="flex items-center gap-x-6 lg:gap-x-8">
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
                                            openMenu === item.label && "bg-graphite text-snow",
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
                                                className="absolute right-0 top-full mt-3 grid w-115 grid-cols-2 gap-1 origin-top rounded-sm bg-charcoal p-1.5 shadow-lg shadow-black/40  border border-graphite"
                                            >
                                                {item.links.map((link) => (
                                                    <MotionLink
                                                        key={link.label}
                                                        href={link.href}
                                                        onClick={() => setOpenMenu(null)}
                                                        initial="rest"
                                                        whileHover="hover"
                                                        className="group relative flex items-start gap-x-3 rounded-[8px] p-2.5 hover:bg-graphite"
                                                    >
                                                        <span className="relative flex size-9 shrink-0 items-center justify-center rounded-[6px] bg-graphite text-mist/50 transition-colors duration-200 group-hover:bg-primary/15 group-hover:text-primary">
                                                            <link.icon className="size-5" />
                                                        </span>
                                                        <span className="relative flex flex-col gap-y-0.5">
                                                            <span className="text-[13px] font-medium text-snow">
                                                                {link.label}
                                                            </span>
                                                            <span className="text-[12.5px] leading-snug text-mist/50">
                                                                {link.description}
                                                            </span>
                                                        </span>
                                                    </MotionLink>
                                                ))}
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

                    <Button
                        className="pl-3!"
                        variant={"tertiary"}
                        onClick={session ? handleRedirect : handleSignin}
                    >
                        Get Started
                        <CtaArrowIcon className="text-ink!" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
