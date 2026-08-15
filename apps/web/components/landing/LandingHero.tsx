import { Button } from "../ui/button";
import { MdChevronRight } from "react-icons/md";
import { cn } from "@/lib/utils";
import BlurFade from "./BlurFade";
import HeroBoardMock from "./HeroBoardMock";
import { landingContainer } from "./LandingSection";
import ShowcaseFrame from "./showcase/ShowcaseFrame";

export default function LandingHero() {
    return (
        <main className="relative min-h-screen w-screen pb-20">
            <section className={cn(landingContainer, "mt-55 h-fit space-y-3")}>
                <BlurFade className="text-snow text-6xl w-[80%] font-headline">
                    Drop an issue on the board.
                    <br />
                    An agent ships the fix.
                </BlurFade>
                <div className="flex w-full items-center">
                    <BlurFade delay={0.2} className="text-snow/60 text-lg w-[60%]">
                        Matcha&apos;s agents claim your issues, build and verify the fix in a
                        sandboxed runner, and hand back a PR ready for review.
                    </BlurFade>
                    <span className="flex-1 flex justify-end gap-2">
                        <Button variant={"tertiary"}>
                            Create Issue
                            <MdChevronRight className="text-ink!" />
                        </Button>
                        <Button className="text-snow/80! bg-snow/10! pl-4 rounded-full">
                            Learn more
                            <MdChevronRight className="text-background!" />
                        </Button>
                    </span>
                </div>
            </section>
            <section className={cn(landingContainer, "mt-10")}>
                {/* Live board mock floating over the fluted-glass hero backdrop. */}
                <ShowcaseFrame
                    image="/landing/hero.jpg"
                    glass={{ angle: 0, size: 0.3 }}
                    className="h-[80vh] rounded-[10px] md:h-[80vh]"
                    contentClassName="hidden h-[86%] w-[86%] max-w-none sm:block"
                >
                    <HeroBoardMock className="h-full w-full" />
                </ShowcaseFrame>
            </section>
        </main>
    );
}
