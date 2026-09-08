"use client";

import {
    DiscordLogoIcon,
    FooterLinkHoverArrowIcon,
    GithubLogoIcon,
    XLogoIcon,
} from "@trydarwin/ui/icons";
import { useInView, useReducedMotion } from "motion/react";
import { type CSSProperties, useRef } from "react";

import { AppLogo } from "@/components/logo/AppLogo";
import { cn } from "@/lib/utils";

import { landingContainer } from "./LandingSection";

const LIGHT_DELAY_MS = 200;

function PromptCard() {
    return (
        <div className="relative flex h-64 w-full flex-col justify-between overflow-hidden rounded-md border border-primary/25 bg-linear-to-b from-[#F1EDFE] via-[#E3DBFB] to-[#CBBFF6] p-5 shadow-[0_8px_24px_-12px_rgba(24,24,27,0.18)] md:h-full">
            <AppLogo className="pointer-events-none absolute -right-8 -bottom-8 h-60 w-auto text-[#E5DDFC]" />

            <div className="relative">
                <h3 className="text-[1.80rem] font-medium text-foreground">
                    Nobody can get past the login screen
                </h3>
                <p className="mt-1 pr-24 text-lg leading-5.5 text-foreground/70">
                    The OTP expires before the email arrives, so the first attempt always fails.
                    Raise the TTL, add a resend path, and open a PR.
                </p>
            </div>

            <div className="relative flex items-center gap-4">
                <AppLogo className="h-8 w-auto text-foreground" />
                <span className="h-9 w-px bg-foreground/15" />
                <div>
                    <p className="text-xs font-semibold text-foreground">darwin agent</p>
                    <p className="text-xs text-foreground/65">Picked up from the board</p>
                </div>
            </div>
        </div>
    );
}

const FOOTER_COLUMNS = [
    { heading: "Product", links: ["Board", "Agent", "Runners", "Playground"] },
    { heading: "Company", links: ["About", "Blog", "Careers"] },
    { heading: "Resources", links: ["Docs", "GitHub", "Changelog"] },
];

const SOCIALS = [
    { label: "GitHub", icon: GithubLogoIcon },
    { label: "X", icon: XLogoIcon },
    { label: "Discord", icon: DiscordLogoIcon },
];

function FooterContent() {
    return (
        <div className="relative z-10 flex flex-1 flex-col justify-between gap-10 px-6 py-8 md:px-10 md:pt-10 md:pb-6">
            <nav className="flex flex-wrap gap-x-16 gap-y-8 md:justify-center">
                {FOOTER_COLUMNS.map((column) => (
                    <div key={column.heading}>
                        <h3 className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                            {column.heading}
                        </h3>
                        <ul className="mt-4 space-y-2.5">
                            {column.links.map((label) => (
                                <li key={label}>
                                    <a
                                        href="#"
                                        className="group inline-flex gap-x-0.5 items-center text-[0.8125rem] text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        {label}
                                        <FooterLinkHoverArrowIcon className="size-4 -translate-y-0.5 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-90 -rotate-135" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </nav>

            <div className="flex items-center justify-between border-t border-edge pt-5">
                <div className="flex items-center gap-3">
                    <AppLogo className="h-4 w-auto text-foreground" />
                    <span className="text-xs text-muted-foreground/70">
                        © 2026 trydarwin. All rights reserved.
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    {SOCIALS.map(({ label, icon: Icon }) => (
                        <a
                            key={label}
                            href="#"
                            aria-label={label}
                            className="text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <Icon className="size-4" />
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function LandingFooter() {
    const footerRef = useRef<HTMLElement>(null);
    const reduceMotion = useReducedMotion();
    const inView = useInView(footerRef, { once: true, amount: 0.4 });
    const lit = Boolean(reduceMotion) || inView;

    return (
        <footer
            ref={footerRef}
            style={
                {
                    "--lit-intensity": 0.45,
                    "--lit-delay": `${LIGHT_DELAY_MS}ms`,
                } as CSSProperties
            }
            className={cn(
                landingContainer,
                "relative mt-20 flex flex-col gap-4 md:h-90 md:flex-row",
            )}
        >
            <div aria-hidden className="relative z-10 md:w-[60%]">
                <PromptCard />
            </div>
            <div
                className={cn(
                    "lit-edge lit-sweep relative flex flex-1 overflow-hidden rounded-md bg-cement shadow-[0_1px_2px_rgba(24,24,27,0.06)]",
                    lit && "is-lit",
                )}
            >
                <FooterContent />
            </div>
        </footer>
    );
}
