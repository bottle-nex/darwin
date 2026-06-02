export type WhySection = {
    label: string;
    headingLines: [string, string];
    paragraphs: [string, string];
    align: "left" | "right";
};

export const sections: WhySection[] = [
    {
        label: "The shift",
        headingLines: ["The backlog was a queue.", "Agents drain it for you."],
        paragraphs: [
            "For years, the issue tracker was a holding pen. Tickets went in, and they sat there until someone had the time, the context, and the energy to pick one up. The board kept score. The work still waited on a human with a free afternoon.",
            "Now agents pull from that same board. They analyze the repo, write the patch, run the tests, and open a PR while you're doing something else. Queued, resolving, in review, resolved. The column you used to drain by hand drains itself.",
        ],
        align: "left",
    },
    {
        label: "What this means",
        headingLines: ["Engineers stopped typing.", "They started directing."],
        paragraphs: [
            "The scarce thing was never ideas for what to fix. It was the hours to sit down and do it. When an agent can take a well-scoped issue to a working PR, the bottleneck moves off the keyboard and onto the decision of what's worth doing.",
            "Your team's job becomes scoping the work and reviewing the result. Read the diff, read the reasoning, approve or send it back. The judgment stays human. The typing doesn't. That's a different shape of engineering, and it's already here.",
        ],
        align: "right",
    },
    {
        label: "The opportunity",
        headingLines: ["From someone should fix", "this to a PR in minutes."],
        paragraphs: [
            "Every team has the list it never gets to. Flaky tests, stale docs, the refactor everyone agrees on but nobody starts. The gap between noticing and shipping was measured in sprints, so the list just grew. People learned to live with it.",
            "File the issue, and an agent spins up a runner, clones your repo, makes the change, and validates it against your real project before opening the PR. Minutes, not sprints. The bottleneck isn't the work anymore. It's deciding what to point it at.",
        ],
        align: "left",
    },
];

export type WhyCard = {
    title: string;
    description: string;
    role: string;
    company: string;
    image: string;
};

export const cards: WhyCard[] = [
    {
        title: "The backlog clears itself",
        description:
            "Assign an issue to an agent and it reads the repo, writes the patch, and opens a PR. The long tail of chores and small fixes stops piling up while you sleep.",
        role: "Engineering Lead",
        company: "Seed-stage startup",
        image: "/images/why/card1.svg",
    },
    {
        title: "You review, you don't type",
        description:
            "Every change lands as a PR with a diff and the agent's reasoning. Your team moves from writing code to directing it, keeping the judgment where it matters.",
        role: "Staff Engineer",
        company: "Platform team",
        image: "/images/why/card2.svg",
    },
    {
        title: "Runs on your repo, your rules",
        description:
            "Matcha works against your codebase with your conventions, your tests, and your review gates. No black box, no lock-in, just agents inside the loop you already trust.",
        role: "Founding Engineer",
        company: "Developer tools",
        image: "/images/why/card3.svg",
    },
];
