"use client";
import { NavBar } from "@/components/nav/Navbar";
import { PiArrowRight, PiPlus } from "react-icons/pi";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/app/Footer";

const cards = [
    {
        title: "The backlog clears itself",
        description:
            "Assign an issue to an agent and it reads the repo, writes the patch, and opens a PR. The long tail of chores and small fixes stops piling up while you sleep.",
        role: "Engineering Lead",
        company: "Seed-stage startup",
    },
    {
        title: "You review, you don't type",
        description:
            "Every change lands as a PR with a diff and the agent's reasoning. Your team moves from writing code to directing it, keeping the judgment where it matters.",
        role: "Staff Engineer",
        company: "Platform team",
    },
    {
        title: "Runs on your repo, your rules",
        description:
            "Matcha works against your codebase with your conventions, your tests, and your review gates. No black box, no lock-in, just agents inside the loop you already trust.",
        role: "Founding Engineer",
        company: "Developer tools",
    },
];

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
            {/* section 2 */}
            <div className="h-max-content w-screen flex">
                <div className="w-11/12 flex flex-col gap-8 border-t border-r border-neutral-800 py-16 px-10 text-secondary">
                    <HeadingText text="The shift" />
                    <div className="text-6xl font-extralight">
                        The backlog was a queue. <br /> Agents drain it for you.
                    </div>
                    <div className="flex gap-10 w-9/12">
                        <div>
                            For years, the issue tracker was a holding pen. Tickets went in, and
                            they sat there until someone had the time, the context, and the energy
                            to pick one up. The board kept score. The work still waited on a human
                            with a free afternoon.
                        </div>
                        <div>
                            Now agents pull from that same board. They analyze the repo, write the
                            patch, run the tests, and open a PR while you're doing something else.
                            Queued, resolving, in review, resolved. The column you used to drain by
                            hand drains itself.
                        </div>
                    </div>
                </div>
                <div className="flex-1 border-t border-neutral-800 relative"></div>
            </div>
            {/* section 3 */}
            <div className="h-max-content w-screen flex flex-row-reverse">
                <div className="w-11/12 flex flex-col items-end gap-8 border-t border-l border-neutral-800 py-16 px-10 text-secondary">
                    <HeadingText text="What this means" />
                    <div className="text-6xl text-end font-extralight">
                        Engineers stopped typing. <br /> They started directing.
                    </div>
                    <div className="flex gap-10 w-9/12">
                        <div>
                            The scarce thing was never ideas for what to fix. It was the hours to
                            sit down and do it. When an agent can take a well-scoped issue to a
                            working PR, the bottleneck moves off the keyboard and onto the decision
                            of what's worth doing.
                        </div>
                        <div>
                            Your team's job becomes scoping the work and reviewing the result. Read
                            the diff, read the reasoning, approve or send it back. The judgment
                            stays human. The typing doesn't. That's a different shape of
                            engineering, and it's already here.
                        </div>
                    </div>
                </div>
                <div className="flex-1 flex border-t border-neutral-800 relative"></div>
            </div>
            {/* section 4 */}
            <div className="h-max-content w-screen flex">
                <div className="w-11/12 flex flex-col gap-8 border-t border-r border-neutral-800 py-16 px-10 text-secondary">
                    <HeadingText text="The opportunity" />
                    <div className="text-6xl font-extralight">
                        From "someone should fix <br /> this" to a PR in minutes.
                    </div>
                    <div className="flex gap-10 w-9/12">
                        <div>
                            Every team has the list it never gets to. Flaky tests, stale docs, the
                            refactor everyone agrees on but nobody starts. The gap between noticing
                            and shipping was measured in sprints, so the list just grew. People
                            learned to live with it.
                        </div>
                        <div>
                            File the issue, and an agent spins up a runner, clones your repo, makes
                            the change, and validates it against your real project before opening
                            the PR. Minutes, not sprints. The bottleneck isn't the work anymore.
                            It's deciding what to point it at.
                        </div>
                    </div>
                </div>
                <div className="flex-1 border-t border-neutral-800 relative"></div>
            </div>

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
