import { SELECTED_TINT_CARD } from "@/components/playground/Core/components/selectionStyles";
import { cn } from "@/lib/utils";

export const CARD_SHELL = cn(
    "surface-card surface-card-interactive rounded-md p-2.25 text-left",
    SELECTED_TINT_CARD,
);

export const BLURRED_BG_TWO = (value: boolean) =>
    cn(value ? "bg-graphite/80 backdrop-blur-xl" : "bg-graphite");

export const BLURRED_BG_PANEL = (value: boolean) =>
    cn(value ? "bg-charcoal/70 backdrop-blur-xl" : "bg-charcoal");
