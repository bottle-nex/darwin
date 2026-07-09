import type { Priority } from "../types";
import type { CustomColumn } from "./types";

/** Map a card's `Priority` to the server's 1–4 priority scale. */
export const PRIORITY_TO_NUMBER: Record<Priority, 1 | 2 | 3 | 4> = {
    urgent: 1,
    high: 2,
    normal: 3,
    low: 4,
};

/**
 * The Custom Kanban starts empty — the user builds it from scratch with "Add
 * list". The custom-board domain isn't persisted yet (mirrors the LLM board's
 * mock data), so columns live in memory once created.
 */
export const INITIAL_CUSTOM_COLUMNS: CustomColumn[] = [];
