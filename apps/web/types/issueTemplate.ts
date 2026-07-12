import type { IconPick } from "@/components/ui/IconPicker";

export interface IssueTemplate {
    id: string;
    name: string;
    summary?: string;
    description: string;
    icon?: IconPick;
    isDefault: boolean;
    createdAt: string;
}

export type PickableTemplate = Pick<
    IssueTemplate,
    "id" | "name" | "summary" | "description" | "icon"
>;

export function isBuiltinTemplate(id: string): boolean {
    return id.startsWith("builtin:");
}
