import { cn } from "@/lib/utils";

export const CARD_SHELL =
    "rounded-md ring-[1px] ring-snow/5 bg-snow/4 p-2.25 text-left hover:bg-snow/6 group-data-[selected=true]/card:border-[rgba(var(--playground-accent-rgb,132,114,245),0.07)] group-data-[selected=true]/card:bg-[rgba(var(--playground-accent-rgb,132,114,245),0.13)] group-data-[selected=true]/card:hover:bg-[rgba(var(--playground-accent-rgb,132,114,245),0.13)]";

export const BLURRED_BG_ONE = (value: boolean) =>
    cn(value ? "bg-snow/40 backdrop-blur-lg" : "bg-charcoal");

export const BLURRED_BG_TWO = (value: boolean) =>
    cn(value ? "bg-graphite/80 backdrop-blur-xl" : "bg-graphite");

export const BLURRED_BG_PANEL = (value: boolean) =>
    cn(value ? "bg-charcoal/70 backdrop-blur-xl" : "bg-charcoal");
