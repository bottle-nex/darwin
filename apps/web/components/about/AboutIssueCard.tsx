import {
    AgentIcon,
    CommentCountIcon,
    ProcessingSpinnerIcon,
    PullRequestOpenIcon,
    RunnerIcon,
    SuccessCircleIcon,
} from "@trymatcha/ui/icons";

import PlaygroundAvatar, {
    type AvatarTone,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import { cn } from "@/lib/utils";

export type AboutIssue = {
    number: string;
    title: string;
    label: string;
    priority: "urgent" | "high" | "normal";
    project: string;
    assignees: { letter: string; tone: AvatarTone }[];
    comments: number;
    status: "in-progress" | "in-review" | "done";
    step?: string;
    runner?: string;
    pr?: { number: string; added: number; removed: number };
    duration?: string;
    agent?: string;
};

const PRIORITY_DOT: Record<AboutIssue["priority"], string> = {
    urgent: "bg-rose-500",
    high: "bg-amber-400",
    normal: "bg-neutral-500",
};

const LABEL_CLASS: Record<string, string> = {
    feature: "bg-indigo-500/15 text-indigo-300",
    bug: "bg-rose-500/15 text-rose-300",
    chore: "bg-neutral-500/15 text-neutral-300",
    test: "bg-emerald-500/15 text-emerald-300",
    security: "bg-red-500/15 text-red-300",
};

function AgentChip({ name }: { name: string }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-neutral-300 ring-1 ring-white/10">
            <AgentIcon className="size-2.5 text-amber-300" />
            {name}
        </span>
    );
}

function StatusRow({ issue }: { issue: AboutIssue }) {
    if (issue.status === "in-progress") {
        return (
            <div className="mt-2.5 flex flex-col gap-1.5">
                {issue.step && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-300/90">
                        <ProcessingSpinnerIcon className="size-3 animate-spin" aria-hidden />
                        {issue.step}
                    </span>
                )}
                <div className="flex items-center justify-between">
                    {issue.runner && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500">
                            <RunnerIcon className="size-3" aria-hidden />
                            {issue.runner}
                        </span>
                    )}
                    {issue.agent && <AgentChip name={issue.agent} />}
                </div>
            </div>
        );
    }

    if (issue.status === "in-review") {
        return (
            <div className="mt-2.5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-violet-300">
                        <PullRequestOpenIcon className="size-3" aria-hidden />
                        {issue.pr?.number}
                    </span>
                    {issue.pr && (
                        <span className="inline-flex items-center gap-1.5 font-mono text-[10px]">
                            <span className="text-emerald-400">+{issue.pr.added}</span>
                            <span className="text-rose-400">-{issue.pr.removed}</span>
                        </span>
                    )}
                </div>
                {issue.agent && (
                    <div className="flex justify-end">
                        <AgentChip name={issue.agent} />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="mt-2.5 flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400/90">
                <SuccessCircleIcon className="size-3" aria-hidden />
                Merged
            </span>
            <span className="text-neutral-500">{issue.duration}</span>
        </div>
    );
}

export default function AboutIssueCard({
    issue,
    className,
}: {
    issue: AboutIssue;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "rounded-lg border border-white/6 bg-neutral-800 p-3 text-left shadow-sm ring-1 ring-black/20",
                className,
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <span
                        className={cn("size-1.5 rounded-full", PRIORITY_DOT[issue.priority])}
                        aria-hidden
                    />
                    <span
                        className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-medium",
                            LABEL_CLASS[issue.label],
                        )}
                    >
                        {issue.label}
                    </span>
                </div>
                <span className="font-mono text-[11px] text-neutral-500">{issue.number}</span>
            </div>

            <p className="mt-2 text-[13px] font-medium leading-snug text-neutral-100">
                {issue.title}
            </p>

            <StatusRow issue={issue} />

            <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5">
                <div className="flex min-w-0 items-center gap-2 text-[11px] text-neutral-500">
                    <span className="inline-flex items-center gap-1">
                        <CommentCountIcon className="size-3" aria-hidden />
                        {issue.comments}
                    </span>
                    <span className="truncate text-neutral-600">{issue.project}</span>
                </div>
                <div className="flex shrink-0 items-center -space-x-1">
                    {issue.assignees.map((assignee) => (
                        <PlaygroundAvatar
                            key={assignee.letter}
                            letter={assignee.letter}
                            tone={assignee.tone}
                            size="sm"
                            className="ring-1 ring-neutral-800"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
