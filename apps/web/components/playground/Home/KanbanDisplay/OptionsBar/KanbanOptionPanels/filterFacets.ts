"use client";
import type { IconType } from "@trymatcha/ui/icons";
import {
    AssigneeGroupIcon,
    CalendarIcon,
    CreatorIcon,
    SearchIcon,
    TagIcon,
} from "@trymatcha/ui/icons";
import { useMemo } from "react";

import { DATE_ICON_COLOR, PRIORITY_OPTIONS } from "@/components/playground/Issue/issueHelpers";
import { useProjectMembers } from "@/hooks/project/useProjectMembers";
import { useListTags } from "@/hooks/tags/useListTags";
import { useActiveProject } from "@/hooks/useActiveProject";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import {
    type BoardFilters,
    type FacetKey,
    type ListFacetKey,
    UNASSIGNED,
} from "@/types/boardFilter";

export const FACET_MENU_CONTENT = "flex max-h-76 w-56 flex-col overflow-hidden p-0";

export type FacetMeta = {
    label: string;
    plural: string;
    icon: IconType;
    iconClassName?: string;
};

export const FACET_META: Record<FacetKey, FacetMeta> = {
    statuses: { label: "Status", plural: "statuses", icon: KanbanBoard.COLUMNS[0].icon },
    priorities: { label: "Priority", plural: "priorities", icon: PRIORITY_OPTIONS[0].icon },
    assigneeIds: { label: "Assignee", plural: "assignees", icon: AssigneeGroupIcon },
    creatorIds: { label: "Creator", plural: "creators", icon: CreatorIcon },
    tagIds: { label: "Tag", plural: "tags", icon: TagIcon },
    createdAt: { label: "Created", plural: "dates", icon: CalendarIcon },
    startDate: {
        label: "Start date",
        plural: "dates",
        icon: CalendarIcon,
        iconClassName: DATE_ICON_COLOR.start,
    },
    targetDate: {
        label: "Target date",
        plural: "dates",
        icon: CalendarIcon,
        iconClassName: DATE_ICON_COLOR.target,
    },
    query: { label: "Title", plural: "titles", icon: SearchIcon },
};

export type FacetOption = {
    value: string;
    label: string;
    icon?: IconType;
    iconClassName?: string;
    dotColor?: string;
    avatarSrc?: string | null;
};

const SEARCHABLE_FACETS: ListFacetKey[] = ["assigneeIds", "creatorIds", "tagIds"];

export function isSearchableFacet(key: ListFacetKey): boolean {
    return SEARCHABLE_FACETS.includes(key);
}

export function facetValues(filters: BoardFilters, key: ListFacetKey): string[] {
    return filters[key].map(String);
}

export function useFacetOptions(key: ListFacetKey): FacetOption[] {
    const projectId = useActiveProject()?.id;
    const { data: members } = useProjectMembers(projectId);
    const { data: tags } = useListTags(projectId);

    return useMemo(() => {
        const people = (members ?? []).map((member) => ({
            value: member.id,
            label: member.name ?? member.email,
            avatarSrc: member.image,
        }));

        switch (key) {
            case "statuses":
                return KanbanBoard.COLUMNS.map((column) => ({
                    value: column.status,
                    label: column.title,
                    icon: column.icon,
                    iconClassName: column.titleBox,
                }));
            case "priorities":
                return PRIORITY_OPTIONS.map((option) => ({
                    value: String(option.rank),
                    label: option.label,
                    icon: option.icon,
                    iconClassName: option.iconClassName,
                }));
            case "assigneeIds":
                return [{ value: UNASSIGNED, label: "Unassigned" }, ...people];
            case "creatorIds":
                return people;
            case "tagIds":
                return (tags ?? []).map((tag) => ({
                    value: tag.id,
                    label: tag.name,
                    dotColor: tag.color,
                }));
        }
    }, [key, members, tags]);
}

export function facetSummary(options: FacetOption[], values: string[], plural: string): string {
    if (values.length === 1) {
        return options.find((option) => option.value === values[0])?.label ?? values[0];
    }
    return `${values.length} ${plural}`;
}
