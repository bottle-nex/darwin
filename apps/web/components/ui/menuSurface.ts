/**
 * The one floating-menu look. Dropdowns, selects, popovers and command palettes
 * all render through these, so a new menu matches the rest by default.
 *
 * The transform-origin differs per Radix primitive, so each adds its own.
 */

import { cn } from "@/lib/utils";
import { BLURRED_BG_TWO } from "@/components/playground/Home/KanbanDisplay/cardStyles";

/** Gap from the trigger. Shared so a popover never sits closer than a dropdown. */
export const MENU_SIDE_OFFSET = 6;

export const MENU_ALIGN = "start" as const;

export const MENU_SURFACE = cn(
    "z-50 min-w-[8rem] rounded-[14px] border border-white/5 p-1 shadow-[0_4px_12px_rgba(0,0,0,0.35)] duration-75 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
    BLURRED_BG_TWO(false),
);

/**
 * Highlight is spelled three ways because the primitives disagree: Radix menus
 * and selects set `data-highlighted`, cmdk sets `data-selected`.
 */
export const MENU_ITEM =
    "flex cursor-pointer items-center gap-2 rounded-[10px] px-2 py-1.5 text-[13.5px] text-snow/90 outline-none select-none data-highlighted:bg-white/5 data-highlighted:text-neutral-100 data-[selected=true]:bg-white/5 data-[selected=true]:text-neutral-100 aria-disabled:pointer-events-none aria-disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0";

export const MENU_ITEM_DESTRUCTIVE =
    "text-rose-400 data-highlighted:bg-rose-500/10 data-highlighted:text-rose-500";

export const MENU_LABEL =
    "px-2 py-1.5 text-[11px] font-medium tracking-wide text-neutral-500 uppercase";

export const MENU_SEPARATOR = "-mx-1 my-1 h-px bg-white/5";
