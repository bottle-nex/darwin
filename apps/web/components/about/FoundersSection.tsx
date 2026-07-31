import Image from "next/image";
import Link from "next/link";
import { FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { azeretMono } from "@/components/ui/button";
import Eyebrow from "./Eyebrow";
import Reveal from "@/components/utility/Reveal";
import { founders } from "./data";

export default function FoundersSection() {
    return (
        <section className="border-t border-white/10">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-6 pt-24 pb-16">
                <Reveal>
                    <Eyebrow text="The people" />
                </Reveal>
                <Reveal delay={0.08}>
                    <h2 className="text-5xl font-extralight leading-[1.05] text-neutral-100 md:text-6xl">
                        Three people with strong opinions <br /> about who should type.
                    </h2>
                </Reveal>
            </div>
            <div className="mx-auto flex w-full max-w-7xl flex-col px-6">
                {founders.map((founder, i) => {
                    const isReversed = i % 2 === 1;
                    return (
                        <Reveal
                            key={founder.name}
                            className="border-t border-white/10 py-16 first:border-t-0"
                        >
                            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
                                <div
                                    className={cn(
                                        "group lg:col-span-5",
                                        isReversed && "lg:order-last",
                                    )}
                                >
                                    <div className="relative aspect-4/5 max-w-md overflow-hidden rounded-xl border border-white/10">
                                        <Image
                                            src={founder.image}
                                            alt={founder.name}
                                            fill
                                            sizes="(max-width: 1024px) 100vw, 40vw"
                                            className="object-cover grayscale transition duration-300 group-hover:grayscale-0"
                                        />
                                        <div className="grain pointer-events-none absolute inset-0" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-5 lg:col-span-7 lg:py-2">
                                    <div
                                        className={cn(
                                            "text-[11px] uppercase tracking-wide text-neutral-500",
                                            azeretMono.className,
                                        )}
                                    >
                                        {founder.role}
                                    </div>
                                    <div className="text-3xl text-neutral-100">{founder.name}</div>
                                    <div className="flex flex-col gap-4 leading-relaxed text-neutral-400">
                                        {founder.bio.map((paragraph) => (
                                            <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                                        ))}
                                    </div>
                                    <div className="mt-2 flex items-center gap-4">
                                        <Link
                                            href={founder.linkedin}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={`${founder.name} on LinkedIn`}
                                            className="text-neutral-500 transition-colors duration-200 hover:text-neutral-100"
                                        >
                                            <FaLinkedinIn className="size-4" />
                                        </Link>
                                        <Link
                                            href={founder.x}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={`${founder.name} on X`}
                                            className="text-neutral-500 transition-colors duration-200 hover:text-neutral-100"
                                        >
                                            <FaXTwitter className="size-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    );
                })}
            </div>
        </section>
    );
}
