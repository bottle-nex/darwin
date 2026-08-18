import { Button } from "../ui/button";
import { MdChevronRight } from "react-icons/md";
import ShowcaseFrame from "../landing/showcase/ShowcaseFrame";

export default function WhyHero() {
    return (
        <section className="w-full pt-40 pb-24">
            <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-6 text-center">
                <div className="bg-snow/10 px-3 py-1 rounded-sm">
                    <p className="text-xs text-snow/80">For engineering teams</p>
                </div>

                <h1 className="font-arimo mt-4 text-5xl leading-[1.1] tracking-tight md:text-6xl text-snow">
                    Issues go in. Pull requests come out.
                </h1>

                <p className="mt-6 max-w-xl text-lg leading-relaxed text-snow/50">
                    Why we built a board that empties itself: file the issue, and get back a
                    verified PR instead of another ticket to pick up.
                </p>

                <div className="mt-8 flex items-center gap-3">
                    <Button className="pl-3! pr-2! h-8 rounded-sm bg-white">
                        Get Started
                        <MdChevronRight className="text-ink!" />
                    </Button>
                    <Button className="bg-snow/10! text-snow rounded-sm pl-3 pr-2 h-8">
                        See how it works
                        <MdChevronRight className="text-snow!" />
                    </Button>
                </div>
            </div>

            <div className="relative mx-auto mt-16 w-full max-w-7xl px-6">
                <div className="relative aspect-5/2 w-full overflow-hidden rounded-3xl">
                    <ShowcaseFrame
                        image="/why/hero.png"
                        glass={{ angle: 0, size: 0.3 }}
                        className="h-[80vh] rounded-lg md:h-[80vh]"
                        contentClassName="hidden h-[86%] w-[86%] max-w-none sm:block"
                    />
                </div>
            </div>
        </section>
    );
}
