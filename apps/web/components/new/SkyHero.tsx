"use client";

import { CtaArrowIcon } from "@trymatcha/ui/icons";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useState } from "react";

import { MatchaLogo } from "@/components/logo/MatchaLogo";
import SkyHeroLogo from "@/components/new/SkyHeroLogo";
import { cn } from "@/lib/utils";

const NAV_ITEMS = ["Introduction", "Why", "Features", "Pricing"];

const ENTER = { duration: 1.1, ease: [0.16, 1, 0.3, 1] as const };

const PRIMARY = "var(--color-primary)";
const INK = "var(--color-ink)";

const primaryTowardInk = (primaryPercent: number) =>
    `color-mix(in oklab, ${PRIMARY} ${primaryPercent}%, ${INK})`;

const DUSK = primaryTowardInk(12);
const VIOLET = primaryTowardInk(45);

const duskAlpha = (percent: number) => `color-mix(in oklab, ${DUSK} ${percent}%, transparent)`;
const violetAlpha = (percent: number) => `color-mix(in oklab, ${VIOLET} ${percent}%, transparent)`;

const SKY_GRADIENT = `linear-gradient(180deg, ${primaryTowardInk(96)} 0%, ${PRIMARY} 30%, ${PRIMARY} 54%, ${primaryTowardInk(60)} 72%, ${INK} 90%)`;

const FOG_GRADIENT = `linear-gradient(to top, ${INK} 0%, ${DUSK} 16%, ${duskAlpha(92)} 28%, ${duskAlpha(70)} 40%, ${violetAlpha(40)} 54%, ${violetAlpha(14)} 68%, transparent 82%)`;

const FOG_PUFF = `radial-gradient(closest-side, ${DUSK} 0%, ${DUSK} 25%, ${duskAlpha(80)} 40%, ${duskAlpha(50)} 58%, ${duskAlpha(22)} 76%, ${duskAlpha(6)} 92%, transparent 100%)`;

const LOGO_HALO =
    "radial-gradient(closest-side, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.18) 45%, transparent 100%)";

type CloudPuff = {
    left: string;
    bottom: string;
    width: string;
    height: string;
    opacity: number;
};

const CLOUD_PUFFS: CloudPuff[] = [
    { left: "-8%", bottom: "18%", width: "50vmax", height: "20vmax", opacity: 0.55 },
    { left: "30%", bottom: "24%", width: "46vmax", height: "18vmax", opacity: 0.5 },
    { left: "62%", bottom: "20%", width: "50vmax", height: "20vmax", opacity: 0.55 },
    { left: "-14%", bottom: "0%", width: "44vmax", height: "20vmax", opacity: 1 },
    { left: "10%", bottom: "-10%", width: "48vmax", height: "26vmax", opacity: 1 },
    { left: "30%", bottom: "6%", width: "42vmax", height: "18vmax", opacity: 0.95 },
    { left: "48%", bottom: "-8%", width: "50vmax", height: "26vmax", opacity: 1 },
    { left: "70%", bottom: "4%", width: "44vmax", height: "20vmax", opacity: 0.95 },
    { left: "40%", bottom: "26%", width: "22vmax", height: "9vmax", opacity: 0.5 },
];

type Annotation = { label: string; left: string; top: string };

const ANNOTATIONS: Annotation[] = [
    { label: "Board × Agents", left: "42%", top: "29%" },
    { label: "matcha", left: "60%", top: "55%" },
];

export default function SkyHero() {
    const reduceMotion = useReducedMotion();
    const [activeNav, setActiveNav] = useState(NAV_ITEMS[0]);

    return (
        <section className="relative isolate min-h-svh w-full overflow-hidden bg-ink text-ink">
            <Sky />
            <Blueprint />

            {/*<div className="absolute right-0 bottom-0 text-snow text-3xl font-semibold ">
                The Product that build Products.
            </div>*/}

            <motion.div
                initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...ENTER, delay: 0.1 }}
                className="pointer-events-none absolute left-1/2 top-[38%] z-10 w-[min(94vw,800px)] -translate-x-1/2 -translate-y-1/2 lg:top-1/2 lg:w-[min(46vw,800px)]"
            >
                <motion.div
                    animate={reduceMotion ? undefined : { y: [0, -12, 0] }}
                    transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                    className="relative"
                >
                    <div
                        style={{ background: LOGO_HALO }}
                        className="absolute -inset-x-[12%] -inset-y-[30%] rounded-full"
                    />
                    <SkyHeroLogo className="relative h-auto w-full" />
                </motion.div>
            </motion.div>

            {/*<CloudHaze />*/}

            {/*{ANNOTATIONS.map((annotation) => (
                <span
                    key={annotation.label}
                    style={{ left: annotation.left, top: annotation.top }}
                    className="pointer-events-none absolute z-20 hidden items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink/65 lg:flex"
                >
                    <span className="text-[8px] text-ink/45">✦</span>
                    {annotation.label}
                </span>
            ))}*/}

            {/*<div className="relative z-30 mx-auto flex min-h-svh w-full max-w-[1920px] flex-col px-5 pb-10 pt-6 sm:px-8 lg:block lg:px-0 lg:py-0">
                <motion.nav
                    initial={reduceMotion ? false : { opacity: 0, y: -14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...ENTER, delay: 0.35 }}
                    className="flex items-center justify-center gap-2 lg:absolute lg:right-[4.5%] lg:top-[30%] lg:justify-end"
                >
                    <ul className="flex items-center gap-1 rounded-full border border-ink/15 bg-ink/[0.06] py-1.5 px-4  ">
                        {NAV_ITEMS.map((item) => (
                            <li key={item}>
                                <button
                                    type="button"
                                    onClick={() => setActiveNav(item)}
                                    className={cn(
                                        "rounded-full border px-3 py-2 text-[13px] leading-none transition-colors duration-300 sm:px-5 sm:py-2.5 sm:text-[17px]",
                                        activeNav === item
                                            ? "border-ink/20 bg-ink/10 text-ink"
                                            : "border-transparent text-ink/75 hover:text-ink",
                                    )}
                                >
                                    {item}
                                </button>
                            </li>
                        ))}
                    </ul>
                    <button
                        type="button"
                        aria-label="Open menu"
                        className="hidden size-[62px] shrink-0 items-center justify-center gap-[3px] rounded-full border border-ink/15 bg-ink/[0.06] transition-colors hover:bg-ink/10 sm:flex"
                    >
                        {Array.from({ length: 4 }, (_, index) => (
                            <span key={index} className="size-[3px] rounded-full bg-ink" />
                        ))}
                    </button>
                </motion.nav>

                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...ENTER, delay: 0.25 }}
                    className="mt-auto w-full max-w-[440px] rounded-[26px] lg:max-w-[min(440px,34vw)] border border-ink/15 bg-ink/[0.04] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] sm:p-8 lg:absolute lg:left-[6%] lg:top-[20%] lg:mt-0"
                >
                    <h1 className="text-[clamp(2.1rem,3vw,2.9rem)] font-medium leading-[1.08] tracking-[-0.03em]">
                        From issue
                        <br />
                        to pull request
                    </h1>
                    <p className="mt-5 max-w-[34ch] text-[17px] leading-[1.45] text-ink/80">
                        matcha picks issues off your board, ships the fix inside a sandboxed runner,
                        and opens the PR for review.
                    </p>
                    <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-4">
                        <Link
                            href="/login"
                            className="group flex items-center gap-2 whitespace-nowrap rounded-full border border-ink/30 bg-ink/10 px-6 py-3 text-[17px] leading-none transition-colors duration-300 hover:bg-ink/15"
                        >
                            Get started
                            <CtaArrowIcon className="size-4" />
                        </Link>
                        <span className="flex items-center gap-2 whitespace-nowrap text-[17px] text-ink/85">
                            Early access open
                            <span className="relative flex size-1.5">
                                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
                            </span>
                        </span>
                    </div>
                </motion.div>
            </div>*/}
        </section>
    );
}

function Sky() {
    return (
        <div className="pointer-events-none absolute inset-0 -z-10">
            {/*<div style={{ background: SKY_GRADIENT }} className="absolute inset-0" />*/}
            <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black_0%,black_40%,transparent_78%)]">
                <div className="absolute inset-y-0 left-1/2 w-[14%] bg-white/[0.08]" />
                <div className="absolute inset-y-0 left-[64%] w-[8%] bg-ink/[0.08]" />
                <div className="absolute inset-y-0 left-[72%] w-[28%] bg-white/[0.12]" />
            </div>
            <MatchaLogo
                fill="none"
                stroke="white"
                strokeWidth={1.5}
                className="absolute left-1/2 top-[44%] h-auto w-[118vw] -translate-x-1/2 -translate-y-1/2 opacity-[0.14] [mask-image:linear-gradient(to_bottom,black_30%,transparent_85%)] lg:top-[46%]"
            />
        </div>
    );
}

function Blueprint() {
    return (
        <svg
            viewBox="0 0 1600 1000"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 h-full w-full [mask-image:linear-gradient(to_bottom,black_45%,transparent_88%)]"
        >
            <defs>
                <pattern
                    id="sky-hero-hatch"
                    width="7"
                    height="7"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(-38)"
                >
                    <line x1="0" y1="0" x2="0" y2="7" stroke="white" strokeOpacity="0.2" />
                </pattern>
            </defs>
            <circle cx="800" cy="500" r="420" fill="url(#sky-hero-hatch)" />
            <circle cx="800" cy="500" r="420" fill="none" stroke="white" strokeOpacity="0.12" />
            <circle cx="800" cy="500" r="320" fill="white" fillOpacity="0.07" />
            <circle cx="800" cy="500" r="320" fill="none" stroke="white" strokeOpacity="0.35" />
            <g stroke="white" strokeOpacity="0.28">
                {/*<line x1="800" y1="0" x2="800" y2="1000" strokeDasharray="2 10" />
                <line x1="430" y1="520" x2="380" y2="440" />
                <line x1="440" y1="600" x2="480" y2="660" />
                <line x1="840" y1="540" x2="900" y2="540" />
                <line x1="100" y1="700" x2="520" y2="330" strokeOpacity="0.12" />
                <line x1="1080" y1="330" x2="1500" y2="700" strokeOpacity="0.12" />*/}
            </g>
            <circle cx="870" cy="540" r="7" fill="none" stroke="white" strokeOpacity="0.55" />
            {/*<g fill="white" fillOpacity="0.85">
                <circle cx="800" cy="130" r="2" />
                <circle cx="568" cy="276" r="2" />
                <circle cx="1032" cy="276" r="2" />
                <circle cx="800" cy="870" r="2" />
                <circle cx="380" cy="500" r="2" />
                <circle cx="1220" cy="500" r="2" />
                <circle cx="530" cy="536" r="2" />
                <circle cx="470" cy="436" r="2" />
            </g>*/}
        </svg>
    );
}

function CloudHaze() {
    return (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[52%]">
            <div style={{ background: FOG_GRADIENT }} className="absolute inset-0" />
            {CLOUD_PUFFS.map((puff, index) => (
                <div
                    key={index}
                    style={{
                        left: puff.left,
                        bottom: puff.bottom,
                        width: puff.width,
                        height: puff.height,
                        opacity: puff.opacity,
                        background: FOG_PUFF,
                    }}
                    className="absolute"
                />
            ))}
        </div>
    );
}
