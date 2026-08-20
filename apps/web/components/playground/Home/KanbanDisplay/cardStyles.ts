import { cn } from "@/lib/utils";

// Shared shell for a board card, so the LLM and Custom Kanban cards can't drift apart.
export const CARD_SHELL =
    "rounded-md p-2.25 text-left bg-snow/4 hover:bg-graphite/40 border-snow/5 border";

export const BLURRED_BG_ONE = (value: boolean) =>
    cn(value ? "bg-snow/9 backdrop-blur-lg" : "bg-charcoal");

export const BLURRED_BG_TWO = (value: boolean) =>
    cn(value ? "bg-graphite/80 backdrop-blur-xl" : "bg-graphite");
