import type { Feature } from "@/types/feature.type";
import ContextAwareMedia from "./media/ContextAwareMedia";
import RealActionMedia from "./media/RealActionMedia";
import ConnectsEverythingMedia from "./media/ConnectsEverythingMedia";
import ImprovesOverTimeMedia from "./media/ImprovesOverTimeMedia";

export const FEATURES: Feature[] = [
    {
        title: "Always context-aware",
        body: "Matcha remembers your preferences, priorities, and past decisions — so you never have to repeat yourself. It understands your work the way a long-time colleague would.",
        Media: ContextAwareMedia,
    },
    {
        title: "Takes real action",
        body: "Every issue is picked up, implemented, and verified inside a sandboxed runner that actually builds and tests your project.",
        Media: RealActionMedia,
    },
    {
        title: "Connects everything",
        body: "The board, your repos, and your CI all read from one place, so an issue carries its full history from filing to merge.",
        Media: ConnectsEverythingMedia,
    },
    {
        title: "Gets better over time",
        body: "Each review you leave feeds back in. The patterns your team keeps asking for become the patterns it reaches for first.",
        Media: ImprovesOverTimeMedia,
    },
];
