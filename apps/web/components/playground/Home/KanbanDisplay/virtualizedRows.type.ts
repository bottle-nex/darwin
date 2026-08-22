import type { MutableRefObject, ReactNode } from "react";

export type AutoFillOptions = {
    key: string;
    hasNextPage: boolean;
    fetchingNextPage: boolean;
    pageError: boolean;
    paused: boolean;
    preservePrepend?: boolean;
    onLoadMore: () => Promise<unknown> | void;
};

export type PrependAnchorCapture = () => (() => void) | undefined;

export type VirtualStatus = {
    label: string;
};

export type VirtualizedRowsProps<T> = {
    rows: T[];
    getRowKey: (row: T) => string;
    renderRow: (row: T, index: number) => ReactNode;
    estimateSize: number;
    gap?: number;
    className?: string;
    contentClassName?: string;
    scrollElementRef?: (element: HTMLDivElement | null) => void;
    findIssueRow?: (issueId: string) => number;
    status: VirtualStatus;
    autoFill?: AutoFillOptions;
    emptyState?: ReactNode;
    footer?: ReactNode;
    contentRole?: "list";
    dataColumnList?: string;
    pinnedIssueId?: string | null;
    stickyRowIndexes?: number[];
    prependAnchorRef?: MutableRefObject<PrependAnchorCapture | null>;
};
