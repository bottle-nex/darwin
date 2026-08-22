"use client";
import { MdChevronRight } from "react-icons/md";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import { Button } from "@/components/ui/button";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useIssueNavigation } from "@/components/playground/Issue/useIssueNavigation";

const CRUMB_LINK =
    "cursor-pointer truncate font-medium text-neutral-400 transition-colors hover:text-neutral-100 capitalize";
const CRUMB_LEAF = "shrink-0 font-medium text-neutral-100 capitalize";

export default function PlaygroundBreadcrumb({
    issueNumber,
    trailing,
}: {
    issueNumber?: number;
    trailing?: string;
}) {
    const project = useActiveProject();
    const { close, showIssueDetail } = useIssueNavigation();
    const inIssue = issueNumber !== undefined;

    return (
        <nav className="flex min-w-0 items-center gap-1.5 text-[14px]">
            <PlaygroundAvatar
                tone="indigo"
                size="md"
                letter={project?.name.slice(0, 2).toUpperCase() ?? "?"}
            />
            {!project ? (
                <span className="h-3 w-24 animate-pulse rounded bg-snow/5" />
            ) : inIssue ? (
                <Button variant="unstyled" type="button" onClick={close} className={CRUMB_LINK}>
                    {project.name}
                </Button>
            ) : (
                <span className="truncate capitalize font-medium text-neutral-200">
                    {project.name}
                </span>
            )}
            {inIssue && (
                <>
                    <Separator />
                    {trailing ? (
                        <Button
                            variant="unstyled"
                            type="button"
                            onClick={showIssueDetail}
                            className={CRUMB_LINK}
                        >
                            #{issueNumber}
                        </Button>
                    ) : (
                        <span className={CRUMB_LEAF}>#{issueNumber}</span>
                    )}
                </>
            )}
            {trailing && (
                <>
                    <Separator />
                    <span className={CRUMB_LEAF}>{trailing}</span>
                </>
            )}
        </nav>
    );
}

function Separator() {
    return <MdChevronRight className="size-3.5 shrink-0 text-neutral-600" aria-hidden />;
}
