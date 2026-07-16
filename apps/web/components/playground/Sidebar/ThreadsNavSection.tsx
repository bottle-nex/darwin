"use client";
import { HiOutlineArrowLeft, HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import { useParams } from "next/navigation";
import Row from "./SidebarRow";
import { type SidebarSectionProps } from "./shared";
import { PlaygroundTab } from "../playgroundTabs";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useIssueThreads } from "@/hooks/chats/useIssueThreads";

/**
 * The threads face of the sidebar, shown while a threads tab is active.
 * "Back" returns to the main nav; "Project chat" is pinned and can't be
 * unpinned; below it, every issue with comment activity, most recent first.
 */
export default function PlaygroundSidebarThreadsNavSection({
    selectedRowId,
    onSelect,
}: SidebarSectionProps) {
    const { projectSlug } = useParams<{ projectSlug?: string }>();
    const activeProject = useActiveProject();
    const { data: threads } = useIssueThreads(activeProject?.id);
    const selectedThread = usePlaygroundNavStore((s) => s.selectedThread);
    const openThread = usePlaygroundNavStore((s) => s.openThread);

    const inDetail = selectedRowId === PlaygroundTab.ThreadDetail;
    const isProjectChatActive = inDetail && selectedThread?.kind === "project";

    return (
        <div className="mt-1 flex flex-col gap-0.5">
            <Row
                leading={{ kind: "icon", icon: HiOutlineArrowLeft }}
                label="Back"
                onClick={() => onSelect(PlaygroundTab.Kanban)}
            />
            <div className="my-1.5 h-px bg-white/5" />
            <Row
                label="Project chat"
                leading={{ kind: "icon", icon: HiOutlineChatBubbleLeftRight }}
                active={isProjectChatActive}
                onClick={() => openThread({ kind: "project" }, projectSlug ?? "")}
            />
            <div className="my-1.5 h-px bg-white/5" />
            {(threads ?? []).map((t) => {
                const isActive =
                    inDetail && selectedThread?.kind === "issue" && selectedThread.issueId === t.id;
                return (
                    <Row
                        key={t.id}
                        label={`#${t.number} ${t.title}`}
                        leading={{ kind: "icon", icon: HiOutlineChatBubbleLeftRight }}
                        active={isActive}
                        onClick={() =>
                            openThread(
                                {
                                    kind: "issue",
                                    issueId: t.id,
                                    issueNumber: t.number,
                                    issueTitle: t.title,
                                },
                                projectSlug ?? "",
                            )
                        }
                    />
                );
            })}
            {threads && threads.length === 0 && (
                <p className="px-2 py-1.5 text-[12px] text-neutral-600">No issue chats yet.</p>
            )}
        </div>
    );
}
