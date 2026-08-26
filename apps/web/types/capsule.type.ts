export type CapsuleViewport = "desktop" | "mobile";

export type CapsuleCompareMode = "split" | "slider";

/**
 * Two real devices, at their real sizes.
 *
 * The frame is what the page is rendered at, and then scaled to fit — not what the pane happens to
 * be. A pane in split view is roughly half a screen, which is under every desktop breakpoint a
 * project defines, so rendering at the pane's own width shows the tablet layout while the control
 * says Desktop.
 *
 * The size does not come from the manifest either. That viewport is the authoring agent's guess at
 * how much room a component wants; a device is a device.
 */
export const CAPSULE_FRAMES = {
    desktop: { width: 1440, height: 900 },
    mobile: { width: 390, height: 844 },
} as const satisfies Record<CapsuleViewport, { width: number; height: number }>;
