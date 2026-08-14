import Image from "next/image";
import { Button } from "../ui/button";
import { MdChevronRight } from "react-icons/md";
import { cn } from "@/lib/utils";
import HeroBoardMock from "./HeroBoardMock";
import { landingContainer } from "./LandingSection";

export default function RevampHero() {
    return (
        <main className="relative min-h-screen w-screen bg-ink pb-20">
            <section className={cn(landingContainer, "mt-55 h-fit space-y-3")}>
                <div className="text-snow text-6xl w-[60%] font-serif">
                    Drop an issue on the board. An agent ships the fix.
                </div>
                <div className="flex w-full items-center">
                    <div className="text-snow/70 text-lg w-[60%]">
                        Your team files issues on a shared board. matcha&apos;s agents claim them,
                        build and verify the fix in a sandboxed runner, and hand back a pull request
                        ready for review.
                    </div>
                    <span className="flex-1 flex justify-end">
                        <Button variant={"tertiary"} className="text-graphite rounded-full bg-snow">
                            Get started
                            <MdChevronRight className="text-background!" />
                        </Button>
                    </span>
                </div>
            </section>
            <section className={cn(landingContainer, "mt-10")}>
                <div className="relative h-[80vh]">
                    <Image
                        src={"/landing/hero.jpg"}
                        alt="something"
                        fill
                        className="object-cover rounded-[10px]"
                    />
                    {/* Live board mock floating over the hero image. */}
                    <div className="absolute inset-0 hidden items-center justify-center sm:flex">
                        <HeroBoardMock className="h-[86%] w-[86%]" />
                    </div>
                </div>
            </section>
        </main>
    );
}
