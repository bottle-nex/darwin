import { ChangelogBackdrop } from "@trymatcha/editorial";
import { cn } from "@/lib/utils";
import BlurFade from "../landing/BlurFade";
import { landingContainer } from "../landing/LandingSection";

export default function ChangeLogHero() {
    return (
        <section className="relative h-screen w-full overflow-hidden">
            <ChangelogBackdrop />
            <div className={cn("relative h-full mt-55", landingContainer)}>
                <BlurFade duration={1.5} delay={0}>
                    <span className="text-[7rem] text-snow font-headline">Change Logs</span>
                </BlurFade>
                <BlurFade duration={1.5} delay={0}>
                    <BlurFade delay={0.2} className="text-snow/60 text-lg w-[60%]">
                        Matcha&apos;s agents claim your issues, build and verify the fix in a
                        sandboxed runner, and hand back a PR ready for review.
                    </BlurFade>
                </BlurFade>
            </div>
        </section>
    );
}
