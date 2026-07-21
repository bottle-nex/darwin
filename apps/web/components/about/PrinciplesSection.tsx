import { cn } from "@/lib/utils";
import { azeretMono } from "@/components/ui/button";
import Eyebrow from "./Eyebrow";
import Reveal from "@/components/utility/Reveal";
import { principles } from "./data";

export default function PrinciplesSection() {
    return (
        <section className="bg-cement">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-6 pb-16">
                <Reveal>
                    <Eyebrow text="How we build" />
                </Reveal>
                <Reveal delay={0.08}>
                    <h2 className="text-5xl font-extralight text-neutral-100 md:text-6xl">
                        Opinions we ship by.
                    </h2>
                </Reveal>
            </div>
            <div className="grid grid-cols-1 gap-px border-y border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-4">
                {principles.map((principle, i) => (
                    <div key={principle.index} className="bg-charcoal">
                        <Reveal
                            delay={i * 0.07}
                            className="group flex h-full flex-col gap-5 p-8 transition-colors duration-200 hover:bg-white/4"
                        >
                            <div
                                className={cn(
                                    "text-xs uppercase tracking-wide text-neutral-500 transition-colors duration-200 group-hover:text-[#bcafff]",
                                    azeretMono.className,
                                )}
                            >
                                {principle.index}
                            </div>
                            <div className="text-xl text-neutral-100">{principle.title}</div>
                            <p className="text-sm leading-relaxed text-neutral-400">
                                {principle.description}
                            </p>
                        </Reveal>
                    </div>
                ))}
            </div>
        </section>
    );
}
