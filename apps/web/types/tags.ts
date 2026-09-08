export interface Tag {
    id: string;
    name: string;
    color: string;
    createdAt: string;
    creator: TagCreator | null;
    issueCount: number;
}

export interface TagCreator {
    id: string;
    name: string | null;
    image: string | null;
}

// Curated swatches that read well on the dark charcoal theme. First is matcha green.
export const TAG_COLORS: string[] = [
    "#9bc24f", // matcha green
    "#60a5fa", // blue
    "#bcafff", // purple
    "#fbbf24", // amber
    "#ff6467", // red
    "#34d399", // emerald
    "#f472b6", // pink
    "#94a3b8", // slate
];
