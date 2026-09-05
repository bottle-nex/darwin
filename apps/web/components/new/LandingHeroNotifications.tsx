"use client";
import { GithubLogoIcon, MergeIcon, RunnerIcon } from "@trymatcha/ui/icons";
import { motion, useReducedMotion } from "motion/react";

import { MatchaLogo } from "@/components/logo/MatchaLogo";
import { CARD_RISE, CARD_STACK } from "@/components/new/landingHeroMotion";

function OverlayCard({
    icon,
    title,
    meta,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    meta: string;
    children: React.ReactNode;
}) {
    return (
        <motion.div
            variants={CARD_RISE}
            className="rounded-2xl border border-white/5 bg-linear-to-br from-charcoal via-charcoal/80 to-ink px-5 py-4 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="flex size-4 items-center justify-center text-neutral-400">
                        {icon}
                    </span>
                    <span className="text-[13px] font-medium text-neutral-200">{title}</span>
                </div>
                <span className="text-[11px] text-neutral-600">{meta}</span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-neutral-400">{children}</p>
        </motion.div>
    );
}
export default function LandingHeroNotifications() {
    const reduceMotion = useReducedMotion();
    const initial = reduceMotion ? false : "hidden";

    return (
        <motion.div
            initial={initial}
            animate="show"
            variants={CARD_STACK}
            className="absolute top-[36%] right-[2.5%] z-30 flex w-100 flex-col gap-4"
        >
            <div className="absolute -inset-12 -z-10 rounded-[48px] bg-black/20 blur-xl" />
            <OverlayCard
                icon={<MatchaLogo className="h-2.5 w-auto text-snow" />}
                title="Morning recap"
                meta="Summarized at 9:41 AM"
            >
                Overnight the agents closed 6 issues and opened 3 pull requests. Two runners are
                still verifying fixes, and NOC-128 is waiting on your review before merge.{" "}
                <span className="cursor-pointer text-neutral-100 underline underline-offset-2">
                    Read more
                </span>
            </OverlayCard>
            <OverlayCard
                icon={<MergeIcon className="size-3.5 text-matcha" />}
                title="PR opened"
                meta="Today · Just now"
            >
                An agent shipped #128 — flaky webhook retries fixed. Build green, 412 tests passing
                in the sandbox before the PR went up.
            </OverlayCard>
            <OverlayCard
                icon={<RunnerIcon className="size-3.5 text-neutral-200" />}
                title="Runner verified"
                meta="Today · 2 min ago"
            >
                A sandboxed runner cloned your repo, reproduced the bug, and ran the full suite
                against the fix before opening the pull request.
            </OverlayCard>
            <OverlayCard
                icon={<GithubLogoIcon className="size-3.5 text-neutral-200" />}
                title="Review requested"
                meta="Today · 12 min ago"
            >
                NOC-131 is ready — the agent requested your review and posted a summary of every
                file it touched.
            </OverlayCard>
        </motion.div>
    );
}
