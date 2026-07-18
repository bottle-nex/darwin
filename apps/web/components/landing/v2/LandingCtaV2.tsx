import Link from "next/link";
import { RiRocketFill, RiTeamFill } from "react-icons/ri";
import { cn } from "@/lib/utils";
import { azeretMono, Button } from "@/components/ui/button";
import Reveal from "@/components/utility/Reveal";
import HeroBuddy from "./HeroBuddy";

const MICRO_LABELS = ["File the issue", "Agent ships the patch", "You review the PR"];

export default function LandingCtaV2() {
    return (
        <section className="relative overflow-hidden border-t border-neutral-200">
            <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(circle,#d9d9d9_1px,transparent_1px)] bg-size-[28px_28px] mask-[radial-gradient(ellipse_at_bottom,black_20%,transparent_70%)]"
            />
            <Reveal className="relative mx-auto flex w-full max-w-7xl flex-col items-center gap-6 px-6 py-24 md:py-40">
                <div
                    className={cn(
                        "flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] uppercase tracking-wide text-neutral-500 shadow-sm",
                        azeretMono.className,
                    )}
                >
                    <HeroBuddy />
                    Start the loop
                </div>
                <h2 className="text-center text-4xl font-light leading-[1.08] tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-6xl sm:leading-[1.02] md:text-7xl">
                    The backlog won&apos;t wait.
                    <br className="hidden sm:inline" />{" "}
                    <span className="text-neutral-400 dark:text-neutral-500 ">Neither do agents.</span>
                </h2>
                <p className="max-w-xl text-center leading-relaxed text-neutral-600 dark:text-neutral-300 ">
                    File your first issue and watch it come back as a pull request.
                </p>
                <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:gap-x-4">
                    <Button size="lg">
                        Get started
                        <RiRocketFill className="size-4" />
                    </Button>
                    <Button size="lg" variant="secondary" asChild>
                        <Link href="/about" className="uppercase">
                            Meet the team
                            <RiTeamFill className="size-4" />
                        </Link>
                    </Button>
                </div>
                <div
                    className={cn(
                        "flex flex-wrap items-center justify-center gap-3 pt-6 text-[12px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400 sm:gap-4",
                        azeretMono.className,
                    )}
                >
                    {MICRO_LABELS.map((label, i) => (
                        <div key={label} className="flex items-center gap-4">
                            {i > 0 && <span className="h-2.5 w-px bg-neutral-300" />}
                            <span>{label}</span>
                        </div>
                    ))}
                </div>
            </Reveal>
        </section>
    );
}
