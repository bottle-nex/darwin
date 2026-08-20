"use client";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import { useActiveProject } from "@/hooks/useActiveProject";

/** Breadcrumb for the Chats topbar. The project chat is the only conversation here. */
export default function ChatsBreadcrumb() {
    const project = useActiveProject();

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
                <span className="truncate font-medium text-neutral-200 capitalize">
                    {project.name}
                </span>
            )}
        </nav>
    );
}
