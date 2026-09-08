export type Principle = {
    index: string;
    title: string;
    description: string;
};

export const principles: Principle[] = [
    {
        index: "01",
        title: "Judgment stays human",
        description:
            "An agent can write the patch, but it can't decide what your product should be. Every change lands as a PR for a person to approve or send back.",
    },
    {
        index: "02",
        title: "Show the diff, always",
        description:
            "No summaries you have to take on faith. You see the code, the tests, and the reasoning behind every change — side by side.",
    },
    {
        index: "03",
        title: "Minutes, not sprints",
        description:
            "The gap between noticing and shipping used to be measured in sprints. It should be measured in the time it takes to review a diff.",
    },
    {
        index: "04",
        title: "No black boxes",
        description:
            "We hold our agents to the bar we hold ourselves: do it clean or don't do it. Real runners, real builds, real tests — against your actual repo.",
    },
];

export type Step = {
    index: string;
    label: string;
    title: string;
    description: string;
};

export const steps: Step[] = [
    {
        index: "01",
        label: "Board",
        title: "File an issue",
        description:
            "Drop it on the board your team already plans on. Scope it like you'd brief a teammate.",
    },
    {
        index: "02",
        label: "Agent",
        title: "An agent claims it",
        description:
            "It reads the repo, builds context, and plans the change before touching a single line.",
    },
    {
        index: "03",
        label: "Runner",
        title: "The work gets verified",
        description:
            "Sandboxed compute clones your project, makes the change, and runs the build and tests against the real thing.",
    },
    {
        index: "04",
        label: "Pull request",
        title: "You review the PR",
        description:
            "The diff and the reasoning land in your repo. Approve it, or send it back with notes.",
    },
];

export type StoryContent = {
    headingLines: [string, string];
    paragraphs: [string, string];
    pullQuote: { muted: string; emphasis: string };
};

export const story: StoryContent = {
    headingLines: ["We got tired of watching", "good issues rot."],
    paragraphs: [
        "darwin started the way most tools do — with a backlog nobody had time for. We kept a tidy board, we wrote good issues, and then we watched them sit there, waiting for an engineer with a free afternoon that never came. The tracker kept score while nothing moved.",
        "So we built the teammate we wished we had. An agent that picks an issue off the board, reads the repo, makes the change in a sandboxed runner, and opens a PR with its reasoning attached. The board stopped being a holding pen and became a pipeline.",
    ],
    pullQuote: {
        muted: "The bottleneck was never ideas.",
        emphasis: "It was hours at the keyboard.",
    },
};

export type Founder = {
    name: string;
    role: string;
    image: string;
    linkedin: string;
    x: string;
    bio: string[];
};

export const founders: Founder[] = [
    {
        name: "Rishi Kant",
        role: "Founder & CEO",
        image: "/images/founders/rishi.jpg",
        linkedin: "https://www.linkedin.com/in/kant-linked/",
        x: "https://x.com/khairrishi",
        bio: [
            "I tried twice to get into Super 30, a six-month bootcamp by Harkirat Singh focused on nurturing software engineers. Didn't make it either time. Instead of dwelling on it, I leaned into what I was good at — building products.",
            "Around that time, one thing kept bothering me: every team I knew had a board full of well-written issues that just sat there, waiting for an engineer with a free afternoon. Agents had finally gotten good enough to do something about that. The idea stuck with me, and I started building the first version of darwin from scratch — a board where you file the issue and an agent takes it all the way to a PR. Soon after, I brought in Anjan Suman and Piyush Raj, and we began shaping it into something real.",
            "The product has been built with a strong focus on design and solid engineering. We've tackled real challenges across agent orchestration, sandboxed code runners, and delivering a clean user experience. As a team, we've taken the product from zero to one. Now, we're figuring out distribution and how to bring it to market.",
        ],
    },
    {
        name: "Anjan Suman",
        role: "Co-Founder",
        image: "/images/founders/anjan.jpeg",
        linkedin: "https://www.linkedin.com/in/anjanstwt/",
        x: "https://x.com/anjanstwt",
        bio: [
            "I started the journey back in 2024 with a question in mind — will I make it or leave it halfway? But you know what they say… “if you truly desire something with all your heart, the whole universe conspires to help you achieve it.”",
            "And then I met Rishi and Piyush, and aah, they pushed me to limits. They always say “do it clean or don't do it.” At the time, I was building some small projects, didn't know why. Then in July, we sat in a meeting and Rishi said, “let's build something real, something together.” That's how darwin began.",
            "From day one, darwin was built with a strong focus on user experience, while staying equally committed to developer experience. It wasn't easy, and still isn't, but it's worth it. As a team, we haven't reached great heights yet, but we've built something just as important — trust. And soon, something we've been working on will be out in the market.",
        ],
    },
    {
        name: "Piyush Raj",
        role: "Co-Founder",
        image: "/images/founders/piyush.jpeg",
        linkedin: "https://www.linkedin.com/in/piyush-rj/",
        x: "https://x.com/PiyushC2P",
        bio: [
            "It started in my third year of college, when I realised things had to change. That's when I decided to try a different path and got into development. I started building things, breaking things, and then pretending I meant to do that. But with time, things began to make sense.",
            "Around mid-2025, I met Rishi and Anjan. We clicked, and naturally decided to build something together. That's how darwin came to life. We spent a lot of time obsessing over the small stuff, especially the edge cases most people don't think about. Turns out, that's where the fun is.",
            "I've always liked making things feel just right. If a picky person looks at something I made and likes it, I take that as a win. With darwin, we tried to keep that same vibe — clean visuals, thoughtful structure, and attention to the details that quietly matter. Us devs have brought it this far together, and honestly, we're just getting started.",
        ],
    },
];
