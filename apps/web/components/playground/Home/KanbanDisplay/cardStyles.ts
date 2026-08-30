import { SELECTED_TINT_CARD } from "@/components/playground/Core/components/selectionStyles";
import { cn } from "@/lib/utils";

export const CARD_SHELL = cn(
    "rounded-md ring-[1px] ring-snow/5 bg-snow/4 p-2.25 text-left hover:bg-snow/6",
    SELECTED_TINT_CARD,
);

export const BLURRED_BG_ONE = (value: boolean) =>
    cn(value ? "bg-snow/40 backdrop-blur-lg" : "bg-charcoal");

export const BLURRED_BG_TWO = (value: boolean) =>
    cn(value ? "bg-graphite/80 backdrop-blur-xl" : "bg-graphite");

export const BLURRED_BG_PANEL = (value: boolean) =>
    cn(value ? "bg-charcoal/70 backdrop-blur-xl" : "bg-charcoal");
