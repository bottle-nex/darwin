"use client";
import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { cn } from "@/lib/utils";

export type BreadcrumbSegment = {
    label: string;
    /** When set, the segment is a button (e.g. the project crumb returns to the list). */
    onClick?: () => void;
};

/**
 * Pane header breadcrumb — a leading icon, `a › b › c` segments, and a trailing
 * GitHub action on the right. Shared by the Projects pane and the Home board, so
 * the crumbs are passed in rather than derived here.
 */
export default function PaneBreadcrumb({
    leading,
    segments,
}: {
    leading?: React.ReactNode;
    segments: BreadcrumbSegment[];
}) {
    return (
        <header className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-white/5 px-3.5">
            <div className="flex min-w-0 items-center gap-1.5 text-[13px] font-medium">
                {leading}
                {segments.map((segment, i) => {
                    const isLast = i === segments.length - 1;
                    return (
                        <Fragment key={i}>
                            {i > 0 && (
                                <ChevronRight
                                    className="size-3.5 shrink-0 text-neutral-600"
                                    aria-hidden
                                />
                            )}
                            {segment.onClick ? (
                                <button
                                    type="button"
                                    onClick={segment.onClick}
                                    className="max-w-60 cursor-pointer truncate text-neutral-400 hover:text-neutral-100"
                                >
                                    {segment.label}
                                </button>
                            ) : (
                                <span
                                    className={cn(
                                        "max-w-60 truncate",
                                        isLast ? "text-neutral-100" : "text-neutral-400",
                                    )}
                                >
                                    {segment.label}
                                </span>
                            )}
                        </Fragment>
                    );
                })}
            </div>
            <button
                type="button"
                aria-label="GitHub repository"
                className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-neutral-400 hover:bg-white/5 hover:text-neutral-100"
            >
                <FaGithub className="size-4" aria-hidden />
            </button>
        </header>
    );
}
