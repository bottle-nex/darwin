export type TourDraft = {
    title: string;
    summary: string;
    description: string;
    teamName: string;
};

export const EMPTY_DRAFT: TourDraft = {
    title: "",
    summary: "",
    description: "",
    teamName: "",
};

export type TourStep = {
    id: 1 | 2 | 3 | 4;
    name: string;
    label: string;
    title: string;
    blurb: string;
};

export const TOUR_STEPS: TourStep[] = [
    {
        id: 1,
        name: "The project",
        label: "Project",
        title: "Start with the project.",
        blurb: "A name and a line or two of context. The agent reads this before anything else.",
    },
    {
        id: 2,
        name: "The repo",
        label: "Repo",
        title: "Point it at the code.",
        blurb: "The agent clones this repository, runs it in a sandbox, and opens pull requests back to it. Nothing merges without your review.",
    },
    {
        id: 3,
        name: "The team",
        label: "Team",
        title: "Decide who files issues.",
        blurb: "Teams scope the board. Anyone on this team can drop issues onto it; you choose who reviews what ships.",
    },
    {
        id: 4,
        name: "The brief",
        label: "Brief",
        title: "Leave a brief for the agent.",
        blurb: "agents.md travels with the repo — commands, conventions, the things you'd tell a new engineer on day one.",
    },
];
