import type { Priority } from "@/types/kanban";

export interface IssueDraftFields {
    title: string;
    descriptionHtml: string;
    priority: Priority;
    memberIds: string[];
    tagIds: string[];
    startDate: string | null;
    targetDate: string | null;
}

export interface IssueDraftRecord {
    key: string;
    updatedAt: number;
    fields: IssueDraftFields;
}
