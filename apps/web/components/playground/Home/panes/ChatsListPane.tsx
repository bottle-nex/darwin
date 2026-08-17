"use client";
import { useParams } from "next/navigation";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import Row from "@/components/playground/Sidebar/SidebarRow";
import { MICRO_LABEL } from "@/components/playground/Core/components/paneBar";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { useActiveProject } from "@/hooks/useActiveProject";
import { useIssueThreads } from "@/hooks/chats/useIssueThreads";

/**
 * The chat list, shown alongside the open conversation whenever the Chats
 * tab is active. "Project chat" is pinned; below it, every issue with
 * comment activity, most recent first.
 */
export default function ChatsListPane() {
    const { projectSlug } = useParams<{ projectSlug?: string }>();
    const activeProject = useActiveProject();
    const { data: threads } = useIssueThreads(activeProject?.id);
    const selectedThread = usePlaygroundNavStore((s) => s.selectedThread);
    const openThread = usePlaygroundNavStore((s) => s.openThread);

    const isProjectChatActive = selectedThread?.kind === "project";

    return (
        <div className="flex w-68 shrink-0 flex-col overflow-y-auto border-r border-white/5 p-2">
            <p className={`${MICRO_LABEL} px-2 py-1.5`}>Chats</p>
            <Row
                label="Project chat"
                leading={{ kind: "icon", icon: HiOutlineChatBubbleLeftRight }}
                active={isProjectChatActive}
                onClick={() => openThread({ kind: "project" }, projectSlug ?? "")}
            />
            <div className="my-1.5 h-px bg-white/5 px-2" />
            {(threads ?? []).map((t) => {
                const isActive =
                    selectedThread?.kind === "issue" && selectedThread.issueId === t.id;
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
