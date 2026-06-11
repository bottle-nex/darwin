import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PiArrowRight } from "react-icons/pi";
import { Button } from "@/components/ui/button";
import Reveal from "@/components/utility/Reveal";
import AboutIssueCard from "./AboutIssueCard";
import FloatingCard from "./FloatingCard";

export default function AboutCta() {
    return (
        <section className="relative overflow-hidden border-t border-neutral-200">
            <FloatingCard
                inView
                className="absolute top-24 -left-8 hidden w-60 lg:block xl:left-8"
                rotation="rotateX(4deg) rotateY(8deg) rotateZ(-2deg) scale(0.95)"
                bob={{ distance: -10, duration: 7.5, delay: 0.3 }}
            >
                <AboutIssueCard
                    issue={{
                        number: "#163",
                        title: "Refactor auth middleware",
                        label: "chore",
                        priority: "high",
                        project: "trymatcha-server",
                        assignees: [{ letter: "P", tone: "blue" }],
                        comments: 2,
                        status: "in-progress",
                        step: "Running tests",
                        runner: "runner-02",
                        agent: "Sonnet 4.6",
                    }}
                    dark
                />
            </FloatingCard>
            <FloatingCard
                inView
                className="absolute bottom-24 -right-8 hidden w-60 lg:block xl:right-8"
                rotation="rotateX(3deg) rotateY(-7deg) rotateZ(2deg) scale(0.95)"
                bob={{ distance: -8, duration: 8.5, delay: 1 }}
            >
                <AboutIssueCard
                    issue={{
                        number: "#158",
                        title: "Add keyboard shortcuts panel",
                        label: "feature",
                        priority: "normal",
                        project: "trymatcha-web",
                        assignees: [{ letter: "R", tone: "indigo" }],
                        comments: 4,
                        status: "in-review",
                        pr: { number: "PR #241", added: 112, removed: 9 },
                        agent: "Sonnet 4.6",
                    }}
                />
            </FloatingCard>
            <Reveal className="mx-auto flex w-full max-w-7xl flex-col items-center gap-5 px-6 py-32">
                <h2 className="text-center text-6xl font-light leading-[1.05] text-neutral-900 md:text-7xl">
                    Stop typing. <br /> Start directing.
                </h2>
                <p className="text-center text-neutral-600">
                    Board in, PRs out. See why teams hand their backlog to matcha.
                </p>
                <div className="flex items-center gap-x-4 pt-2">
                    <Button size="lg">
                        Get started
                        <PiArrowRight className="h-3 w-3" />
                    </Button>
                    <Button
                        size="lg"
                        variant="secondary"
                        className="uppercase hover:bg-transparent hover:text-neutral-600"
                        asChild
                    >
                        <Link href="/why">
                            Why matcha
                            <ArrowRight />
                        </Link>
                    </Button>
                </div>
            </Reveal>
        </section>
    );
}
