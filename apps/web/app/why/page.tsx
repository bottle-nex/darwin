"use client";
import Image from "next/image";
import { NavBar } from "@/components/nav/Navbar";
import { PiArrowRight } from "react-icons/pi";
import { MdArrowForward } from "react-icons/md";
import { azeretMono, Button } from "@/components/ui/button";
import { Footer } from "@/components/app/Footer";
import { cn } from "@/lib/utils";
import { cards, sections } from "@/components/why/data";
import { HalftoneShape } from "@/lib/halftone/shape";

function HeadingText({ text }: { text: string }) {
    return (
        <>
            <div className="flex gap-3 items-center">
                <div className="h-2 w-4 bg-blue-800"></div>
                <div className="text-neutral-500 font-medium">{text}</div>
            </div>
        </>
    );
}

export default function WhyPage() {
    return (
        <main className="flex min-h-screen flex-col pt-17 bg-charcoal select-none">
            <NavBar isMarkettingPage={true} />
            <div className="relative h-screen w-screen flex flex-col items-center overflow-hidden bg-charcoal p-12">
                <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-start justify-center flex-1 gap-7">
                    <HeadingText text="Why matcha" />
                    <div className="text-8xl w-3xl text-left text-secondary font-light leading-[0.95]">
                        Ship the backlog, not the burnout
                    </div>
                    <div className="text-neutral-300 max-w-xl text-left text-lg leading-relaxed">
                        Issues used to wait for an engineer with a free afternoon. Now you assign
                        them to an agent that reads the repo, writes the patch, and opens a PR, you
                        review the diff instead of writing it.
                    </div>
                    <div className="flex items-center gap-x-4 pt-1">
                        <Button size="lg" variant={"tertiary"}>
                            Get started
                            <PiArrowRight className="h-3 w-3" />
                        </Button>
                        <Button
                            size="lg"
                            variant="ghost"
                            className="text-secondary hover:bg-transparent hover:text-secondary/70"
                        >
                            See how it works
                            <MdArrowForward />
                        </Button>
                    </div>
                    <div
                        className={cn(
                            "flex items-center gap-4 pt-4 text-[12px] uppercase tracking-wide text-neutral-400",
                            azeretMono.className,
                        )}
                    >
                        <span>Reads the repo</span>
                        <span className="h-2.5 w-px bg-neutral-700" />
                        <span>Writes the patch</span>
                        <span className="h-2.5 w-px bg-neutral-700" />
                        <span>Opens the PR</span>
                    </div>
                </div>
                <Image
                    src="/anim/traffic.gif"
                    alt="Agents clearing the backlog"
                    width={1080}
                    height={1439}
                    unoptimized
                    priority
                    className="absolute -top-12 -right-12 h-[145%] w-auto max-w-none object-contain mix-blend-screen"
                />
            </div>
            {sections.map((section) => {
                const isRight = section.align === "right";
                return (
                    <div
                        key={section.label}
                        className={cn("h-max-content w-screen flex", isRight && "flex-row-reverse")}
                    >
                        <div
                            className={cn(
                                "w-11/12 flex flex-col gap-8 border-t border-neutral-800 py-16 px-10 text-secondary",
                                isRight ? "items-end border-l" : "border-r",
                            )}
                        >
                            <HeadingText text={section.label} />
                            <div className={cn("text-6xl font-extralight", isRight && "text-end")}>
                                {section.headingLines[0]} <br /> {section.headingLines[1]}
                            </div>
                            <div className="flex gap-10 w-9/12">
                                <div>{section.paragraphs[0]}</div>
                                <div>{section.paragraphs[1]}</div>
                            </div>
                        </div>
                        <div className="flex-1 border-t border-neutral-800 relative"></div>
                    </div>
                );
            })}

            {/* cards section */}

            <div className="min-h-screen flex flex-col gap-6 text-secondary px-10 py-8 border-t border-t-neutral-700">
                <HeadingText text="Stop sitting on the backlog." />
                <div className="text-6xl font-extralight">
                    File the issue, get the PR. The <br /> board does the rest.
                </div>
                <div className="text-neutral-300">
                    Put agents to work on the same board your team already plans on.
                </div>
                <div className="flex gap-4 py-10">
                    {cards.map((card) => (
                        <div
                            key={card.title}
                            className="flex-1 flex flex-col gap-4 border border-neutral-800 p-4 rounded-sm"
                        >
                            <div className="text-xl"> {card.title} </div>
                            <div className="border-t border-b border-neutral-800 border-dotted h-65 w-full overflow-hidden">
                                <HalftoneShape src={card.image} ink="#ab9ff2" />
                            </div>
                            <div className="text-neutral-400 min-h-30"> {card.description} </div>
                            <div className="flex items-center justify-between">
                                <div className="flex text-sm gap-4">
                                    <div className="border-r border-neutral-800 pr-4">
                                        {card.role}
                                    </div>
                                    <div className="text-neutral-500">{card.company}</div>
                                </div>
                                <Button size={"icon"}>
                                    <PiArrowRight className="" />
                                </Button>{" "}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="h-screen flex flex-col items-center justify-center text-secondary gap-5">
                <div className="text-center text-7xl font-light">
                    Hand your backlog <br /> to an agent.
                </div>
                <div className="text-neutral-300">
                    Board in, PRs out. Agent-native, repo-aware, and built to ship.
                </div>
                <Button size={"lg"}>
                    Get Started
                    <MdArrowForward className="text-neutral-800!" />
                </Button>
            </div>
            <Footer isMarkettingPage={true} />
        </main>
    );
}
