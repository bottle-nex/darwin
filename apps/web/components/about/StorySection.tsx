import Eyebrow from "./Eyebrow";
import Reveal from "@/components/utility/Reveal";
import AboutIssueCard from "./AboutIssueCard";
import FloatingCard from "./FloatingCard";
import { story } from "./data";

export default function StorySection() {
    return (
        <section className="border-t border-neutral-200">
            <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-6 py-24 lg:grid-cols-12">
                <Reveal className="flex flex-col gap-7 lg:col-span-5">
                    <Eyebrow text="Where this started" />
                    <h2 className="text-5xl font-extralight leading-[1.05] text-neutral-900 md:text-6xl">
                        {story.headingLines[0]} <br /> {story.headingLines[1]}
                    </h2>
                </Reveal>
                <Reveal delay={0.1} className="flex flex-col gap-14 lg:col-span-7 lg:pt-2">
                    <div className="flex flex-col gap-10 leading-relaxed text-neutral-600 md:flex-row">
                        <p className="flex-1">{story.paragraphs[0]}</p>
                        <p className="flex-1">{story.paragraphs[1]}</p>
                    </div>
                    <div className="flex items-end justify-between gap-10">
                        <p className="max-w-2xl text-3xl font-extralight leading-snug text-neutral-400">
                            {story.pullQuote.muted}{" "}
                            <span className="text-neutral-900">{story.pullQuote.emphasis}</span>
                        </p>
                        <FloatingCard
                            inView
                            className="hidden w-56 shrink-0 xl:block"
                            rotation="rotateX(3deg) rotateY(-5deg) rotateZ(1deg)"
                            bob={{ distance: -8, duration: 8, delay: 0.5 }}
                        >
                            <AboutIssueCard
                                issue={{
                                    number: "#128",
                                    title: "Set up CI pipeline",
                                    label: "chore",
                                    priority: "normal",
                                    project: "trymatcha-web",
                                    assignees: [{ letter: "A", tone: "emerald" }],
                                    comments: 3,
                                    status: "done",
                                    duration: "4m 12s",
                                }}
                            />
                        </FloatingCard>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
