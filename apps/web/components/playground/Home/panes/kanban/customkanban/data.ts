import type { Priority } from "../types";
import type { CustomColumn } from "./types";

/** Priority choices for the Add Card modal, in descending urgency. */
export const PRIORITIES: { value: Priority; label: string }[] = [
    { value: "urgent", label: "Urgent" },
    { value: "high", label: "High" },
    { value: "normal", label: "Normal" },
    { value: "low", label: "Low" },
];

/**
 * The Custom Kanban starts empty — the user builds it from scratch with "Add
 * list". The custom-board domain isn't persisted yet (mirrors the LLM board's
 * mock data), so columns live in memory once created.
 */
export const INITIAL_CUSTOM_COLUMNS: CustomColumn[] = [];
