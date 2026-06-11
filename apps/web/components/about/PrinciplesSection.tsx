import { cn } from "@/lib/utils";
import { azeretMono } from "@/components/ui/button";
import Eyebrow from "./Eyebrow";
import Reveal from "@/components/utility/Reveal";
import { principles } from "./data";

export default function PrinciplesSection() {
    return (
        <section>
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-6 pb-16">
                <Reveal>
                    <Eyebrow text="How we build" />
                </Reveal>
                <Reveal delay={0.08}>
                    <h2 className="text-5xl font-extralight text-neutral-900 md:text-6xl">
                        Opinions we ship by.
                    </h2>
                </Reveal>
            </div>
            <div className="grid grid-cols-1 gap-px border-y border-neutral-200 bg-neutral-200 md:grid-cols-2 lg:grid-cols-4">
                {principles.map((principle, i) => (
                    <div key={principle.index} className="bg-snow">
                        <Reveal
                            delay={i * 0.07}
                            className="group flex h-full flex-col gap-5 p-8 transition-colors duration-200 hover:bg-mist"
                        >
                            <div
                                className={cn(
                                    "text-xs uppercase tracking-wide text-neutral-400 transition-colors duration-200 group-hover:text-[#AB9FF2]",
                                    azeretMono.className,
                                )}
                            >
                                {principle.index}
                            </div>
                            <div className="text-xl text-neutral-900">{principle.title}</div>
                            <p className="text-sm leading-relaxed text-neutral-500">
                                {principle.description}
                            </p>
                        </Reveal>
                    </div>
                ))}
            </div>
        </section>
    );
}
