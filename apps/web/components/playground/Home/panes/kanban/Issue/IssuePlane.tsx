"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCreateIssue } from "@/hooks/issues/useCreateIssue";
import Capsule, { type CapsuleOption } from "./Capsule";
import MembersCapsule from "./MembersCapsule";
import TagsCapsule from "./TagsCapsule";
import IssueDescriptionEditor from "./editor/IssueDescriptionEditor";
import type { Priority } from "../types";
import { PRIORITY_TO_NUMBER } from "../customkanban/data";
import { LuInfo } from "react-icons/lu";

const PRIORITY_OPTIONS: CapsuleOption[] = [
    { value: "urgent", label: "Urgent", dotClassName: "bg-rose-500" },
    { value: "high", label: "High", dotClassName: "bg-amber-400" },
    { value: "normal", label: "Normal", dotClassName: "bg-neutral-500" },
    { value: "low", label: "Low", dotClassName: "bg-neutral-600" },
];

interface IssuePlaneProps {
    projectId: string | undefined;
    onClose: () => void;
}

export default function IssuePlane({ projectId, onClose }: IssuePlaneProps) {
    const [title, setTitle] = useState("");
    const [summary, setSummary] = useState("");
    const [description, setDescription] = useState("");
    const [descriptionEmpty, setDescriptionEmpty] = useState(true);
    const [priority, setPriority] = useState<Priority>("normal");
    const [memberIds, setMemberIds] = useState<string[]>([]);
    const [tagIds, setTagIds] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
    const createIssue = useCreateIssue();

    const canCreate =
        title.trim().length > 0 &&
        !descriptionEmpty &&
        memberIds.length > 0 &&
        Boolean(projectId) &&
        !createIssue.isPending;

    async function handleCreate() {
        if (!canCreate || !projectId) return;
        try {
            await createIssue.mutateAsync({
                project_id: projectId,
                title: title.trim(),
                summary: summary.trim() || undefined,
                description,
                priority: PRIORITY_TO_NUMBER[priority],
                assignee_ids: memberIds,
                tag_ids: tagIds,
                start_date: startDate?.toISOString(),
                target_date: targetDate?.toISOString(),
            });
            onClose();
        } catch {
            toast.error("Couldn't create the issue.");
        }
    }

    return (
        <div className={cn(
            "h-[90%] w-[70%] absolute top-1/2 left-1/2 -translate-1/2 z-40 ",
            "bg-[#1a1a1b] ring ring-white/10 rounded-xl ",
            "flex flex-col justify-between divide-y divide-white/10 *:px-8 *:py-4 "
        )}>

            <div className="flex flex-col items-start gap-y-3 ">
                <div className="w-full flex flex-col items-start ">
                    <Input
                        autoFocus
                        variant={"ghost"}
                        placeholder="Issue Title"
                        maxLength={80}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-3xl ring-0 border-0 font-semibold h-9 p-0"
                    />
                    <Input
                        variant={"ghost"}
                        placeholder="Add a short summary..."
                        maxLength={255}
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        className="h-7 p-0"
                    />
                </div>
                <div className="flex items-center gap-x-4 ">
                    <Capsule
                        type="dropdown"
                        options={PRIORITY_OPTIONS}
                        defaultValue="normal"
                        onChange={(value) => setPriority(value as Priority)}
                    />
                    <MembersCapsule projectId={projectId} onChange={setMemberIds} />
                    <Capsule type="calendar" placeholder="Start date" onChange={setStartDate} />
                    <Capsule type="calendar" placeholder="Target date" onChange={setTargetDate} />
                    <TagsCapsule projectId={projectId} onChange={setTagIds} />
                </div>
            </div>
            <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto ">
                <IssueDescriptionEditor
                    onChange={(html, isEmpty) => {
                        setDescription(html);
                        setDescriptionEmpty(isEmpty);
                    }}
                />
            </div>
            <div className="h-fit flex items-center justify-between ">
                <div className="flex items-center justify-center gap-x-1 text-xs text-white/70">
                    <LuInfo size={10} />
                    <span>
                        The more you briefly define the issue, our agent will more accurately be able to solve it.
                    </span>
                </div>
                <div className="flex items-center justify-end gap-x-2 ">
                    <Button variant={"tertiary"} onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={!canCreate}>
                        {createIssue.isPending ? "Creating..." : "Create Issue"}
                    </Button>
                </div>
            </div>

        </div>
    )
}
