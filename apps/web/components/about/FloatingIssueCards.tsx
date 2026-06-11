import AboutIssueCard, { type AboutIssue } from "./AboutIssueCard";
import FloatingCard from "./FloatingCard";

type HeroCard = {
    issue: AboutIssue;
    dark: boolean;
    className: string;
    rotation: string;
    bob: { distance: number; duration: number; delay: number };
    entranceDelay: number;
};

const HERO_CARDS: HeroCard[] = [
    {
        issue: {
            number: "#147",
            title: "Add OTP rate limiting to auth",
            label: "security",
            priority: "high",
            project: "trymatcha-server",
            assignees: [{ letter: "R", tone: "indigo" }],
            comments: 3,
            status: "in-review",
            pr: { number: "PR #233", added: 86, removed: 12 },
            agent: "Sonnet 4.6",
        },
        dark: false,
        className: "absolute top-0 left-0 w-64",
        rotation: "rotateX(4deg) rotateY(7deg) rotateZ(-1deg) scale(0.97)",
        bob: { distance: -10, duration: 7, delay: 0.6 },
        entranceDelay: 0.42,
    },
    {
        issue: {
            number: "#152",
            title: "Fix flaky checkout e2e test",
            label: "bug",
            priority: "urgent",
            project: "trymatcha-web",
            assignees: [{ letter: "A", tone: "purple" }],
            comments: 5,
            status: "in-progress",
            step: "Writing patch",
            runner: "runner-04",
            agent: "Opus 4.8",
        },
        dark: true,
        className: "absolute top-36 right-0 w-72",
        rotation: "rotateX(5deg) rotateY(-6deg)",
        bob: { distance: -14, duration: 5.5, delay: 0 },
        entranceDelay: 0.3,
    },
    {
        issue: {
            number: "#139",
            title: "Migrate emails to Resend",
            label: "chore",
            priority: "normal",
            project: "trymatcha-server",
            assignees: [{ letter: "P", tone: "blue" }],
            comments: 2,
            status: "done",
            duration: "5m 41s",
        },
        dark: false,
        className: "absolute bottom-0 left-10 w-60",
        rotation: "rotateX(3deg) rotateY(5deg) rotateZ(1deg) scale(0.94)",
        bob: { distance: -8, duration: 8, delay: 1.2 },
        entranceDelay: 0.54,
    },
];

export default function FloatingIssueCards() {
    return (
        <div className="relative h-140 w-full perspective-distant">
            <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(circle,#d4d4d4_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
            />
            {HERO_CARDS.map((card) => (
                <FloatingCard
                    key={card.issue.number}
                    className={card.className}
                    rotation={card.rotation}
                    bob={card.bob}
                    entranceDelay={card.entranceDelay}
                >
                    <AboutIssueCard issue={card.issue} dark={card.dark} />
                </FloatingCard>
            ))}
        </div>
    );
}
