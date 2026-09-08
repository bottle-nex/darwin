import { ChangelogBackdrop } from "@trydarwin/editorial";

import { cn } from "@/lib/utils";

import BlurFade from "../landing/BlurFade";
import { landingContainer } from "../landing/LandingSection";
import BlogTabs, { type BlogTab } from "./BlogTabs";

export default function BlogHero({ active }: { active: BlogTab }) {
    return (
        <section className="relative mt-17 flex h-[calc(100dvh-4.25rem)] w-full flex-col justify-end overflow-hidden pb-20">
            <ChangelogBackdrop />

            <div className={cn(landingContainer, "relative")}>
                <div className="max-w-[46rem] space-y-6">
                    <BlurFade>
                        <BlogTabs active={active} />
                    </BlurFade>

                    <BlurFade delay={0.1} className="font-headline text-6xl text-snow">
                        What&apos;s new in Darwin.
                        <br />
                        Built to ship better.
                    </BlurFade>

                    <BlurFade delay={0.2} className="text-lg text-snow/60 md:w-[85%]">
                        See what we&apos;ve been shipping at Darwin, from smarter agents and faster
                        workflows to the improvements that make building and shipping software
                        easier.
                    </BlurFade>
                </div>
            </div>
        </section>
    );
}
