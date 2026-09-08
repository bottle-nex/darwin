import type { ReactNode } from "react";

import {
    AgentClaimsArt,
    FileIssueArt,
    PLATE_BONE,
    PLATE_DARWIN,
    ReviewPrArt,
    VerifiedArt,
} from "./WhyArt";

const SECTION_GROUND = "#F4EDE3";
const TITLE_INK = "#2A2524";
const BODY_INK = "#5C5751";

type WhyStage = {
    index: string;
    title: string;
    description: string;
    plate: string;
    Art: () => ReactNode;
};

const WHY_STAGES: WhyStage[] = [
    {
        index: "01",
        title: "File an issue",
        description:
            "Drop it on the board your team already plans on. Scope it the way you'd brief a teammate: what's broken, what good looks like, and anything the code won't tell you on its own.",
        plate: PLATE_BONE,
        Art: FileIssueArt,
    },
    {
        index: "02",
        title: "An agent claims it",
        description:
            "It pulls the card and reads the repo before touching a single line, learning your conventions, your structure, and the blast radius of the change. Then it plans the work.",
        plate: PLATE_DARWIN,
        Art: AgentClaimsArt,
    },
    {
        index: "03",
        title: "The work gets verified",
        description:
            "Sandboxed compute clones your project and makes the change against the real thing. The build runs. The tests run. Nothing moves forward until they pass.",
        plate: PLATE_BONE,
        Art: VerifiedArt,
    },
    {
        index: "04",
        title: "You review the PR",
        description:
            "The diff and the reasoning land in your repo as a pull request. Approve it, or send it back with notes. Nothing merges itself.",
        plate: PLATE_DARWIN,
        Art: ReviewPrArt,
    },
];

export default function WhyProcess() {
    return (
        <section className="w-full py-32" style={{ backgroundColor: SECTION_GROUND }}>
            <div className="mx-auto w-full max-w-7xl px-6">
                <p
                    className="max-w-4xl text-[3rem] leading-tight tracking-tight"
                    style={{ color: TITLE_INK }}
                >
                    Issues go in. Pull requests come out.
                </p>
                <p className="mt-6 max-w-xl text-base leading-relaxed" style={{ color: BODY_INK }}>
                    Every tracker ends the same way: a drawer of well written issues waiting for an
                    engineer with a free afternoon. Here is what happens instead.
                </p>

                <div className="mt-28 flex flex-col gap-28">
                    {WHY_STAGES.map((stage, i) => (
                        <div
                            key={stage.index}
                            className="grid grid-cols-1 items-center gap-10 md:grid-cols-5 md:gap-16"
                        >
                            <div
                                className={`grain overflow-hidden rounded-xl md:col-span-3 ${
                                    i % 2 === 1 ? "md:order-2" : ""
                                }`}
                                style={{ backgroundColor: stage.plate }}
                            >
                                <stage.Art />
                            </div>
                            <div className={`md:col-span-2 ${i % 2 === 1 ? "md:order-1" : ""}`}>
                                <div
                                    className="font-mono text-xs tracking-widest"
                                    style={{ color: BODY_INK }}
                                >
                                    {stage.index}
                                </div>
                                <h2
                                    className="mt-4 text-3xl leading-tight tracking-tight"
                                    style={{ color: TITLE_INK }}
                                >
                                    {stage.title}
                                </h2>
                                <p
                                    className="mt-4 text-[0.95rem] leading-relaxed"
                                    style={{ color: BODY_INK }}
                                >
                                    {stage.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
