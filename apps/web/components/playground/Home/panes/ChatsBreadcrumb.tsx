"use client";
import { MdChevronRight } from "react-icons/md";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useIssueRoute } from "@/components/playground/Issue/useIssueRoute";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";

/** Breadcrumb for the Chats topbar: project name, plus the open issue's title when one is selected. */
export default function ChatsBreadcrumb() {
    const project = useActiveProject();
    const selectedThread = usePlaygroundNavStore((s) => s.selectedThread);
    const { openIssue } = useIssueRoute();
    const isIssueThread = selectedThread?.kind === "issue";

    return (
        <nav className="flex min-w-0 items-center gap-1.5 text-[13px]">
            <PlaygroundAvatar
                tone="indigo"
                size="md"
                letter={project?.name.slice(0, 2).toUpperCase() ?? "?"}
            />
            {!project ? (
                <span className="h-3 w-24 animate-pulse rounded bg-white/5" />
            ) : (
                <span
                    className={cn(
                        "truncate font-medium capitalize",
                        isIssueThread ? "text-neutral-400" : "text-neutral-200",
                    )}
                >
                    {project.name}
                </span>
            )}
            {isIssueThread && (
                <>
                    <MdChevronRight className="size-3.5 shrink-0 text-neutral-600" aria-hidden />
                    <Button
                        variant="unstyled"
                        type="button"
                        onClick={() => openIssue(selectedThread.issueId)}
                        className="cursor-pointer truncate font-medium text-neutral-100 transition-colors hover:text-neutral-300"
                    >
                        #{selectedThread.issueNumber} {selectedThread.issueTitle}
                    </Button>
                </>
            )}
        </nav>
    );
}
