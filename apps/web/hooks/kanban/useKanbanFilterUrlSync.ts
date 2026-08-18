"use client";
import { useEffect, useRef } from "react";
import { IssueStatus } from "@trymatcha/types";
import { hasActiveFilters } from "@/lib/kanban/boardFilter";
import { useKanbanFilterStore } from "@/store/kanban/useKanbanFilterStore";
import type { ServerIssueStatus } from "@/types/board";
import {
    DATE_FACET_KEYS,
    EMPTY_FILTERS,
    LIST_FACET_KEYS,
    type BoardFilters,
    type DateFacetKey,
    type DateRangeFilter,
    type ListFacetKey,
} from "@/types/boardFilter";

const LIST_PARAM: Record<ListFacetKey, string> = {
    statuses: "status",
    priorities: "priority",
    assigneeIds: "assignee",
    creatorIds: "creator",
    tagIds: "tag",
};

const DATE_PARAM: Record<DateFacetKey, string> = {
    createdAt: "created",
    startDate: "start",
    targetDate: "target",
};

const QUERY_PARAM = "q";

const KNOWN_STATUSES = new Set<string>(Object.values(IssueStatus));

function parseList(raw: string | null): string[] {
    return raw ? raw.split(",").filter(Boolean) : [];
}

function parseRange(raw: string | null): DateRangeFilter | null {
    if (!raw) return null;
    const [from, to] = raw.split("..");
    if (!from && !to) return null;
    return { from: from || null, to: to || null };
}

function serializeRange(range: DateRangeFilter | null): string | null {
    if (!range || (!range.from && !range.to)) return null;
    return `${range.from ?? ""}..${range.to ?? ""}`;
}

function readFilters(params: URLSearchParams): BoardFilters {
    return {
        ...EMPTY_FILTERS,
        statuses: parseList(params.get(LIST_PARAM.statuses)).filter((value) =>
            KNOWN_STATUSES.has(value),
        ) as ServerIssueStatus[],
        priorities: parseList(params.get(LIST_PARAM.priorities))
            .map(Number)
            .filter((value) => Number.isInteger(value) && value >= 0 && value <= 4),
        assigneeIds: parseList(params.get(LIST_PARAM.assigneeIds)),
        creatorIds: parseList(params.get(LIST_PARAM.creatorIds)),
        tagIds: parseList(params.get(LIST_PARAM.tagIds)),
        createdAt: parseRange(params.get(DATE_PARAM.createdAt)),
        startDate: parseRange(params.get(DATE_PARAM.startDate)),
        targetDate: parseRange(params.get(DATE_PARAM.targetDate)),
        query: params.get(QUERY_PARAM) ?? "",
    };
}

/**
 * Mirrors the board filters into the query string so a filtered board survives
 * a refresh and can be shared as a link. Only ever touches its own params, so
 * it coexists with `usePlaygroundUrlSync` writing `tab`/`team`/`thread`.
 */
export function useKanbanFilterUrlSync() {
    const filters = useKanbanFilterStore((s) => s.filters);
    const setFilters = useKanbanFilterStore((s) => s.setFilters);
    const hydratedRef = useRef(false);

    useEffect(() => {
        if (hydratedRef.current) return;
        const fromUrl = readFilters(new URLSearchParams(window.location.search));
        if (hasActiveFilters(fromUrl)) setFilters(fromUrl);
        hydratedRef.current = true;
    }, [setFilters]);

    useEffect(() => {
        if (!hydratedRef.current) return;
        const params = new URLSearchParams(window.location.search);
        for (const key of LIST_FACET_KEYS) {
            const value = filters[key];
            if (value.length > 0) params.set(LIST_PARAM[key], value.join(","));
            else params.delete(LIST_PARAM[key]);
        }
        for (const key of DATE_FACET_KEYS) {
            const value = serializeRange(filters[key]);
            if (value) params.set(DATE_PARAM[key], value);
            else params.delete(DATE_PARAM[key]);
        }
        if (filters.query.trim()) params.set(QUERY_PARAM, filters.query);
        else params.delete(QUERY_PARAM);

        const next = `${window.location.pathname}?${params.toString()}`;
        if (next !== `${window.location.pathname}${window.location.search}`) {
            window.history.replaceState(null, "", next);
        }
    }, [filters]);
}
