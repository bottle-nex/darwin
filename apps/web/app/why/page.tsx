"use client";
import { NavBar } from "@/components/nav/Navbar";
import { PiArrowRight } from "react-icons/pi";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/app/Footer";
import { cn } from "@/lib/utils";
import { cards, sections } from "@/components/why/data";

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
        <main className="flex min-h-screen flex-col pt-17 bg-secondary-foreground">
            <NavBar isMarkettingPage={true} />
            <div className="h-screen w-screen flex flex-col items-center bg-secondary-foreground p-12">
                <div className="text-7xl w-2xl text-center text-secondary font-light">
                    Your backlog should clear itself
                </div>
                <div className="text-neutral-100 w-xl text-center pt-8 text-xl">
                    Issues used to wait for an engineer with a free afternoon. Now you assign them
                    to an agent that reads the repo, writes the patch, and opens a PR. You review
                    the diff instead of writing it.
                </div>
                <div className="flex-1 w-full flex flex-col items-center justify-center">
                    <div className="h-40 w-40 rounded-xl bg-amber-50"></div>
                </div>
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
                            <div className="border-t border-b border-neutral-800 border-dotted h-65 w-full"></div>
                            <div className="text-neutral-400 min-h-30"> {card.description} </div>
                            <div className="flex items-center justify-between">
                                <div className="flex text-sm gap-4">
                                    <div className="border-r border-neutral-800 pr-4">
                                        {card.role}
                                    </div>
                                    <div className="text-neutral-500">{card.company}</div>
                                </div>
                                <Button size={"icon"} variant={"secondary"}>
                                    <PiArrowRight className="text-neutral-800!" />
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
                <Button size={"lg"} variant={"secondary"}>
                    Get Started
                    <ArrowRight className="text-neutral-800!" />
                </Button>
            </div>
            <Footer isMarkettingPage={true} />
        </main>
    );
}
