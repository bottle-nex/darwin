import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { landingContainer } from "../landing/LandingSection";
import { ChangelogBackdrop } from "@trymatcha/editorial";
import BlurFade from "../landing/BlurFade";

export default function ChangeLogHero() {
    return (
        <section className="relative h-screen w-full overflow-hidden">
            <ChangelogBackdrop />
            <div
                className={cn(
                    "relative h-full flex flex-col items-start justify-start pt-20",
                    landingContainer,
                )}
            >
                <section className={cn(landingContainer, "mt-55 h-fit space-y-6")}>
                    <BlurFade className="flex items-center gap-2">
                        <Button variant="tertiary">All</Button>
                        <Button className="text-snow/80! bg-snow/10! px-4 rounded-full">
                            Changelogs
                        </Button>
                        <Button className="text-snow/80! bg-snow/10! px-4 rounded-full">
                            Blogs
                        </Button>
                    </BlurFade>

                    <BlurFade delay={0.1} className="text-snow text-6xl w-[80%] font-headline">
                        What&apos;s new in Matcha.
                        <br />
                        Built to ship better.
                    </BlurFade>

                    <div className="flex w-full items-center">
                        <BlurFade delay={0.2} className="text-snow/60 text-lg w-[60%]">
                            See what we&apos;ve been shipping at Matcha, from smarter agents and
                            faster workflows to the improvements that make building and shipping
                            software easier.
                        </BlurFade>
                    </div>
                </section>
            </div>
        </section>
    );
}
