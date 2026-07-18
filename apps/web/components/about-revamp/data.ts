import { founders } from "@/components/about/data";

export const gridConfig = {
    columns: 16,
    rows: 10,
};

export type SpecialCell = {
    row: number;
    col: number;
    variant: "image" | "logo";
    imageSrc?: string;
    imageAlt?: string;
};

// 5 cells scattered across the grid: 4 founder photos + 1 matcha logo.
export const specialCells: SpecialCell[] = [
    { row: 2, col: 2, variant: "image", imageSrc: founders[0].image, imageAlt: founders[0].name },
    { row: 2, col: 13, variant: "image", imageSrc: founders[1].image, imageAlt: founders[1].name },
    { row: 6, col: 4, variant: "image", imageSrc: founders[2].image, imageAlt: founders[2].name },
    { row: 6, col: 11, variant: "image", imageSrc: founders[2].image, imageAlt: founders[2].name },
    { row: 8, col: 7, variant: "logo" },
];

export type Stat = {
    value: string;
    label: string;
};

export const stats: Stat[] = [
    { value: "2025", label: "Founded" },
    { value: "3", label: "Founding engineers" },
    { value: "100%", label: "Human-reviewed PRs" },
];
