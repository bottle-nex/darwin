/**
 * The wash a selected card or row gets: the user's background-glow accent, at an
 * alpha that preset chooses for itself (see `BACKGROUND_LIGHTING_PRESETS`), so a
 * bright colour like amber doesn't shout where violet whispers. Written out in
 * full because Tailwind only sees class names that appear literally in the source.
 */
export const SELECTED_TINT =
    "bg-[rgba(var(--playground-accent-rgb,132,114,245),var(--playground-selection-alpha,0.13))] hover:bg-[rgba(var(--playground-accent-rgb,132,114,245),var(--playground-selection-alpha,0.13))]";

/** The same wash for cards, which flip it through their wrapper's `data-selected`. */
export const SELECTED_TINT_CARD =
    "group-data-[selected=true]/card:bg-[rgba(var(--playground-accent-rgb,132,114,245),var(--playground-selection-alpha,0.13))] group-data-[selected=true]/card:hover:bg-[rgba(var(--playground-accent-rgb,132,114,245),var(--playground-selection-alpha,0.13))]";
