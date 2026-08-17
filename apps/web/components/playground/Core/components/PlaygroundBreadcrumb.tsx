"use client";
import { MdChevronRight } from "react-icons/md";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import { Button } from "@/components/ui/button";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useIssueRoute } from "@/components/playground/Issue/useIssueRoute";

export default function PlaygroundBreadcrumb({ issueNumber }: { issueNumber?: number }) {
    const project = useActiveProject();
    const { close } = useIssueRoute();
    const inIssue = issueNumber !== undefined;

    return (
        <nav className="flex min-w-0 items-center gap-1.5 text-[13px]">
            <PlaygroundAvatar
                tone="indigo"
                size="sm"
                letter={project?.name.slice(0, 2).toUpperCase() ?? "?"}
            />
            {!project ? (
                <span className="h-3 w-24 animate-pulse rounded bg-white/5" />
            ) : inIssue ? (
                <Button
                    variant="unstyled"
                    type="button"
                    onClick={close}
                    className="cursor-pointer truncate font-medium text-neutral-400 transition-colors hover:text-neutral-100 capitalize"
                >
                    {project.name}
                </Button>
            ) : (
                <span className="truncate capitalize font-medium text-neutral-200">
                    {project.name}
                </span>
            )}
            {inIssue && (
                <>
                    <MdChevronRight className="size-3.5 shrink-0 text-neutral-600" aria-hidden />
                    <span className="shrink-0 font-medium text-neutral-100 capitalize">
                        #{issueNumber}
                    </span>
                </>
            )}
        </nav>
    );
}
