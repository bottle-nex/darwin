const CARD_COUNT = 4;

/** Tailwind `gap-4` on the row. */
const ROW_GAP = 16;

/** Tailwind `max-w-7xl` on the section, which has no horizontal padding. */
const ROW_MAX_WIDTH = 1280;

/** Shares of the row an open card takes, against 1 for each collapsed card. */
export const OPEN_GROW = 1.15;

const availableWidth = ROW_MAX_WIDTH - ROW_GAP * (CARD_COUNT - 1);
const collapsedWidth = availableWidth / (OPEN_GROW + (CARD_COUNT - 1));

export const TEASER_WIDTH = `${collapsedWidth}px`;
export const DETAIL_WIDTH = `${collapsedWidth * OPEN_GROW}px`;
