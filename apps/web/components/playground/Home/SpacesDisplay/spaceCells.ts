/** Column widths shared by the list header and every space row, so they can't drift. */
export const SPACE_CELL = {
    description: "hidden min-w-0 flex-1 lg:block",
    target: "hidden w-28 shrink-0 lg:flex",
    issues: "w-12 shrink-0 text-right",
    progress: "w-16 shrink-0",
    actions: "w-8 shrink-0",
} as const;
