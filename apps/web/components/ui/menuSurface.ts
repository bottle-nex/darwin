/**
 * The one floating-menu look. Dropdowns, selects, popovers and command palettes
 * all render through these, so a new menu matches the rest by default.
 *
 * The transform-origin differs per Radix primitive, so each adds its own.
 */

import { cn } from "@/lib/utils";

/** Gap from the trigger. Shared so a popover never sits closer than a dropdown. */
export const MENU_SIDE_OFFSET = 6;

export const MENU_ALIGN = "start" as const;

export const MENU_SURFACE = cn(
    "z-50 min-w-[10rem] rounded-lg p-1 duration-75 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
    "surface-menu",
);

/**
 * Highlight is spelled three ways because the primitives disagree: Radix menus
 * and selects set `data-highlighted`, cmdk sets `data-selected`.
 */
export const MENU_ITEM =
    "flex cursor-pointer items-center gap-2 rounded-sm px-2.5 py-1.5 text-[13.5px] text-overlay/90 outline-none select-none data-highlighted:bg-overlay/8 data-highlighted:text-foreground data-[selected=true]:bg-overlay/8 data-[selected=true]:text-foreground aria-disabled:pointer-events-none aria-disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0";

export const MENU_ITEM_DESTRUCTIVE =
    "text-danger data-highlighted:bg-danger-surface data-highlighted:text-danger";

export const MENU_LABEL =
    "px-2 py-1.5 text-[11px] font-medium tracking-wide text-neutral-500 uppercase";

export const MENU_SEPARATOR = "-mx-1 my-1 h-px bg-overlay/5";
