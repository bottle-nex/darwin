"use client";

import { useParams } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";
import { HiOutlineHashtag } from "react-icons/hi2";
import { MdChat } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { usePlaygroundNavStore } from "@/store/playground/usePlaygroundNavStore";
import { useIssueDialog } from "@/components/playground/issue/useIssueDialog";
import { useIssueReferences } from "@/hooks/issues/useIssueReferences";
import { displayNameOf } from "@/components/playground/Core/components/PlaygroundAvatar";

/** Every conversation that #-tags this issue. Hidden until there is one. */
export default function IssueReferences({ issueId }: { issueId?: string }) {
    const { data: references } = useIssueReferences(issueId);
    const openThread = usePlaygroundNavStore((s) => s.openThread);
    const { close } = useIssueDialog();
    const { projectSlug } = useParams<{ projectSlug?: string }>();

    if (!references?.length) return null;

    return (
        <section className="mt-6 flex flex-col gap-y-1.5">
            <header className="flex items-center gap-x-2 text-[11px] font-medium tracking-wide text-neutral-500 uppercase">
                <HiOutlineHashtag className="size-3.5" />
                Referenced in
            </header>
            <ul className="flex flex-col gap-y-px">
                {references.map((reference) => (
                    <li key={reference.id}>
                        <Button
                            variant="unstyled"
                            type="button"
                            onClick={() => {
                                if (!projectSlug) return;
                                close();
                                openThread(reference.thread, projectSlug);
                            }}
                            className="flex w-full cursor-pointer flex-col items-start gap-y-0.5 rounded-[6px] px-2 py-1.5 text-left transition-colors hover:bg-white/5"
                        >
                            <span className="flex w-full items-center gap-x-1.5 text-[12px] text-neutral-300">
                                <MdChat className="size-3 shrink-0 text-neutral-500" />
                                <span className="truncate font-medium">
                                    {reference.thread.kind === "project"
                                        ? "Project chat"
                                        : `#${reference.thread.issueNumber} ${reference.thread.issueTitle}`}
                                </span>
                                <span className="ml-auto shrink-0 text-[10px] text-neutral-500">
                                    {formatDistanceToNowStrict(new Date(reference.createdAt), {
                                        addSuffix: true,
                                    })}
                                </span>
                            </span>
                            <span className="line-clamp-2 text-[12px] leading-4 text-neutral-500">
                                <span className="text-neutral-400">
                                    {reference.sender
                                        ? displayNameOf(
                                              reference.sender.name,
                                              reference.sender.email,
                                          )
                                        : "Unknown"}
                                </span>
                                {": "}
                                {reference.message}
                            </span>
                        </Button>
                    </li>
                ))}
            </ul>
        </section>
    );
}
