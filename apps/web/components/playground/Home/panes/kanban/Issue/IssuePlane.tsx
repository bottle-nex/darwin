import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Capsule, { type CapsuleOption } from "./Capsule";
import MembersCapsule from "./MembersCapsule";
import TagsCapsule from "./TagsCapsule";
import IssueDescriptionEditor from "./editor/IssueDescriptionEditor";

const PRIORITY_OPTIONS: CapsuleOption[] = [
    { value: "none", label: "No priority", dotClassName: "bg-neutral-600" },
    { value: "urgent", label: "Urgent", dotClassName: "bg-rose-500" },
    { value: "high", label: "High", dotClassName: "bg-amber-400" },
    { value: "medium", label: "Medium", dotClassName: "bg-neutral-500" },
    { value: "low", label: "Low", dotClassName: "bg-neutral-600" },
];

const STATUS_OPTIONS: CapsuleOption[] = [
    { value: "backlog", label: "Backlog", dotClassName: "bg-neutral-500" },
    { value: "planned", label: "Planned", dotClassName: "bg-sky-400" },
    { value: "in_progress", label: "In Progress", dotClassName: "bg-amber-400" },
    { value: "completed", label: "Completed", dotClassName: "bg-indigo-400" },
    { value: "canceled", label: "Canceled", dotClassName: "bg-neutral-600" },
];

interface IssuePlaneProps {
    projectId: string | undefined;
}

export default function IssuePlane({ projectId }: IssuePlaneProps) {
    return (
        <div className={cn(
            "h-[90%] w-[70%] absolute top-1/2 left-1/2 -translate-1/2 ",
            "bg-[#1a1a1b] ring ring-white/10 rounded-xl ",
            "flex flex-col justify-between divide-y divide-white/10 *:px-8 *:py-4 "
        )}>

            <div className="flex flex-col items-start gap-y-3 ">
                <div className="w-full flex flex-col items-start ">
                    <Input
                        variant={"ghost"}
                        placeholder="Issue Title"
                        className="text-3xl ring-0 border-0 font-semibold h-9 p-0"
                    />
                    <Input
                        variant={"ghost"}
                        placeholder="Add a short summary..."
                        className="h-7 p-0"
                    />
                </div>
                <div className="flex items-center gap-x-4 ">
                    <Capsule
                        type="dropdown-search"
                        options={STATUS_OPTIONS}
                        defaultValue="backlog"
                        searchPlaceholder="Change status..."
                    />
                    <Capsule type="dropdown" options={PRIORITY_OPTIONS} defaultValue="none" />
                    <MembersCapsule projectId={projectId} />
                    <Capsule type="calendar" placeholder="Start date" />
                    <Capsule type="calendar" placeholder="Target date" />
                    <TagsCapsule projectId={projectId} />
                </div>
            </div>
            <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto ">
                <IssueDescriptionEditor />
            </div>
            <div className="h-fit flex items-center justify-end gap-x-2 ">
                <Button
                    variant={"tertiary"}
                >
                    Cancel
                </Button>
                <Button>
                    Create Issue
                </Button>
            </div>

        </div>
    )
}