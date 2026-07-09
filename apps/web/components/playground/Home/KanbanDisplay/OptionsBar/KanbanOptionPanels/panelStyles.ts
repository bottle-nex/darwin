// Shared classNames for the option dropdown panels, matching the app's dark
// popover style (see PlaygroundUserMenu).

export const PANEL_CONTENT =
    "z-50 origin-(--radix-dropdown-menu-content-transform-origin) rounded-lg border border-neutral-800 bg-charcoal p-1 shadow-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95";

export const PANEL_ITEM =
    "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-neutral-300 outline-none select-none data-highlighted:bg-white/5 data-highlighted:text-neutral-100";

export const PANEL_LABEL =
    "px-2 py-1.5 text-[11px] font-medium tracking-wide text-neutral-500 uppercase";
