import { MdAccessTimeFilled, MdAutorenew, MdCallSplit, MdCheckCircle } from "react-icons/md";
import type { Column, ColumnTheme, Label, Priority } from "./types";

export const CLAUDE_PRIMARY = "#D97757";

const LABEL_CLASS = "bg-neutral-100 text-neutral-600";
const label = (name: string): Label => ({ name, className: LABEL_CLASS });

export const PRIORITY_DOT: Record<"light" | "dark", Record<Priority, string>> = {
    light: {
        urgent: "bg-neutral-900",
        high: "bg-neutral-500",
        normal: "bg-neutral-300",
    },
    dark: {
        urgent: "bg-neutral-100",
        high: "bg-neutral-400",
        normal: "bg-neutral-600",
    },
};

const LIGHT_THEME: ColumnTheme = {
    surface: "bg-neutral-200/80 border border-neutral-200",
    headerText: "text-neutral-700",
    badge: "bg-neutral-200 text-neutral-600",
    menu: "text-neutral-400",
};

const DARK_THEME: ColumnTheme = {
    surface: "bg-neutral-900",
    headerText: "text-white",
    badge: "bg-white/15 text-white",
    menu: "text-neutral-500",
};

export const COLUMNS: Column[] = [
    {
        status: "Queued",
        icon: MdAccessTimeFilled,
        theme: LIGHT_THEME,
        dark: false,
        issues: [
            {
                number: "#142",
                title: "Add dark mode toggle to settings",
                label: label("feature"),
                priority: "normal",
                agent: "Sonnet 4.6",
                comments: 4,
                state: "queued",
                queuePosition: 1,
            },
            {
                number: "#138",
                title: "Improve onboarding flow copy",
                label: label("docs"),
                priority: "normal",
                agent: "Sonnet 4.6",
                comments: 1,
                state: "queued",
                queuePosition: 2,
            },
            {
                number: "#131",
                title: "Refactor auth middleware",
                label: label("chore"),
                priority: "high",
                agent: "Sonnet 4.6",
                comments: 0,
                state: "queued",
                queuePosition: 3,
            },
        ],
    },
    {
        status: "Resolving",
        icon: MdAutorenew,
        theme: DARK_THEME,
        dark: true,
        issues: [
            {
                number: "#150",
                title: "Fix memory leak in the editor",
                label: label("bug"),
                priority: "urgent",
                agent: "Opus 4.8",
                comments: 7,
                state: "processing",
                step: "Writing patch",
            },
            {
                number: "#149",
                title: "Add keyboard shortcuts panel",
                label: label("feature"),
                priority: "high",
                agent: "Sonnet 4.6",
                comments: 2,
                state: "processing",
                step: "Analyzing repo",
            },
        ],
    },
    {
        status: "In Review",
        icon: MdCallSplit,
        theme: LIGHT_THEME,
        dark: false,
        issues: [
            {
                number: "#145",
                title: "Implement realtime collaboration",
                label: label("feature"),
                priority: "high",
                agent: "Opus 4.8",
                comments: 12,
                state: "review",
                pr: "PR #234",
                diff: { added: 128, removed: 16 },
            },
            {
                number: "#140",
                title: "Migrate to Next.js 16",
                label: label("chore"),
                priority: "normal",
                agent: "Sonnet 4.6",
                comments: 5,
                state: "review",
                pr: "PR #231",
                diff: { added: 64, removed: 40 },
            },
        ],
    },
    {
        status: "Resolved",
        icon: MdCheckCircle,
        theme: LIGHT_THEME,
        dark: false,
        issues: [
            {
                number: "#128",
                title: "Set up CI pipeline",
                label: label("chore"),
                priority: "normal",
                agent: "Sonnet 4.6",
                comments: 3,
                state: "done",
                duration: "4m 12s",
            },
            {
                number: "#120",
                title: "Add end-to-end tests",
                label: label("test"),
                priority: "normal",
                agent: "Opus 4.8",
                comments: 6,
                state: "done",
                duration: "7m 03s",
            },
        ],
    },
];

export function ordinal(value: number): string {
    const suffixes = ["th", "st", "nd", "rd"];
    const remainder = value % 100;
    return value + (suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0]);
}
