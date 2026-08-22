import { cn } from "@/lib/utils";

// Shared shell for a board card, so the LLM and Custom Kanban cards can't drift apart.
export const CARD_SHELL =
    "rounded-md border border-snow/5 bg-snow/4 p-2.25 text-left hover:bg-snow/6 group-data-[selected=true]/card:border-primary/7 group-data-[selected=true]/card:bg-[#292B44] group-data-[selected=true]/card:hover:bg-[#292B44]";

export const BLURRED_BG_ONE = (value: boolean) =>
    cn(value ? "bg-snow/40 backdrop-blur-lg" : "bg-charcoal");

export const BLURRED_BG_TWO = (value: boolean) =>
    cn(value ? "bg-graphite/80 backdrop-blur-xl" : "bg-graphite");

export const BLURRED_BG_PANEL = (value: boolean) =>
    cn(value ? "bg-charcoal/70 backdrop-blur-xl" : "bg-charcoal");
