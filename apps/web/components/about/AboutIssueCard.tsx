import {
    CheckCircle2,
    GitPullRequest,
    Loader,
    MessageSquare,
    Server,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PlaygroundAvatar, {
    type AvatarTone,
} from "@/components/playground/Core/components/PlaygroundAvatar";

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

const PRIORITY_DOT: Record<"light" | "dark", Record<AboutIssue["priority"], string>> = {
    light: { urgent: "bg-rose-500", high: "bg-amber-500", normal: "bg-neutral-300" },
    dark: { urgent: "bg-rose-500", high: "bg-amber-400", normal: "bg-neutral-500" },
};

const LABEL_CLASS: Record<"light" | "dark", Record<string, string>> = {
    light: {
        feature: "bg-indigo-500/10 text-indigo-600",
        bug: "bg-rose-500/10 text-rose-600",
        chore: "bg-neutral-500/10 text-neutral-600",
        test: "bg-emerald-500/10 text-emerald-600",
        security: "bg-red-500/10 text-red-600",
    },
    dark: {
        feature: "bg-indigo-500/15 text-indigo-300",
        bug: "bg-rose-500/15 text-rose-300",
        chore: "bg-neutral-500/15 text-neutral-300",
        test: "bg-emerald-500/15 text-emerald-300",
        security: "bg-red-500/15 text-red-300",
    },
};

function AgentChip({ name, dark }: { name: string; dark: boolean }) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1",
                dark
                    ? "bg-white/5 text-neutral-300 ring-white/10"
                    : "bg-neutral-100 text-neutral-600 ring-black/5",
            )}
        >
            <Sparkles className={cn("size-2.5", dark ? "text-amber-300" : "text-amber-500")} />
            {name}
        </span>
    );
}

function StatusRow({ issue, dark }: { issue: AboutIssue; dark: boolean }) {
    if (issue.status === "in-progress") {
        return (
            <div className="mt-2.5 flex flex-col gap-1.5">
                {issue.step && (
                    <span
                        className={cn(
                            "inline-flex items-center gap-1.5 text-[11px] font-medium",
                            dark ? "text-amber-300/90" : "text-amber-600",
                        )}
                    >
                        <Loader className="size-3 animate-spin" aria-hidden />
                        {issue.step}
                    </span>
                )}
                <div className="flex items-center justify-between">
                    {issue.runner && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500">
                            <Server className="size-3" aria-hidden />
                            {issue.runner}
                        </span>
                    )}
                    {issue.agent && <AgentChip name={issue.agent} dark={dark} />}
                </div>
            </div>
        );
    }

    if (issue.status === "in-review") {
        return (
            <div className="mt-2.5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <span
                        className={cn(
                            "inline-flex items-center gap-1.5 text-[11px] font-medium",
                            dark ? "text-violet-300" : "text-violet-600",
                        )}
                    >
                        <GitPullRequest className="size-3" aria-hidden />
                        {issue.pr?.number}
                    </span>
                    {issue.pr && (
                        <span className="inline-flex items-center gap-1.5 font-mono text-[10px]">
                            <span className={dark ? "text-emerald-400" : "text-emerald-600"}>
                                +{issue.pr.added}
                            </span>
                            <span className={dark ? "text-rose-400" : "text-rose-500"}>
                                -{issue.pr.removed}
                            </span>
                        </span>
                    )}
                </div>
                {issue.agent && (
                    <div className="flex justify-end">
                        <AgentChip name={issue.agent} dark={dark} />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="mt-2.5 flex items-center justify-between text-[11px]">
            <span
                className={cn(
                    "inline-flex items-center gap-1.5 font-medium",
                    dark ? "text-emerald-400/90" : "text-emerald-600",
                )}
            >
                <CheckCircle2 className="size-3" aria-hidden />
                Merged
            </span>
            <span className="text-neutral-500">{issue.duration}</span>
        </div>
    );
}

export default function AboutIssueCard({
    issue,
    dark = false,
    className,
}: {
    issue: AboutIssue;
    dark?: boolean;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "rounded-lg border p-3 text-left shadow-sm",
                dark
                    ? "border-white/6 bg-neutral-800 ring-1 ring-black/20"
                    : "border-black/5 bg-white",
                className,
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <span
                        className={cn(
                            "size-1.5 rounded-full",
                            PRIORITY_DOT[dark ? "dark" : "light"][issue.priority],
                        )}
                        aria-hidden
                    />
                    <span
                        className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-medium",
                            LABEL_CLASS[dark ? "dark" : "light"][issue.label],
                        )}
                    >
                        {issue.label}
                    </span>
                </div>
                <span
                    className={cn(
                        "font-mono text-[11px]",
                        dark ? "text-neutral-500" : "text-neutral-400",
                    )}
                >
                    {issue.number}
                </span>
            </div>

            <p
                className={cn(
                    "mt-2 text-[13px] font-medium leading-snug",
                    dark ? "text-neutral-100" : "text-neutral-800",
                )}
            >
                {issue.title}
            </p>

            <StatusRow issue={issue} dark={dark} />

            <div
                className={cn(
                    "mt-3 flex items-center justify-between border-t pt-2.5",
                    dark ? "border-white/5" : "border-neutral-100",
                )}
            >
                <div className="flex min-w-0 items-center gap-2 text-[11px] text-neutral-500">
                    <span className="inline-flex items-center gap-1">
                        <MessageSquare className="size-3" aria-hidden />
                        {issue.comments}
                    </span>
                    <span
                        className={cn("truncate", dark ? "text-neutral-600" : "text-neutral-400")}
                    >
                        {issue.project}
                    </span>
                </div>
                <div className="flex shrink-0 items-center -space-x-1">
                    {issue.assignees.map((assignee) => (
                        <PlaygroundAvatar
                            key={assignee.letter}
                            letter={assignee.letter}
                            tone={assignee.tone}
                            size="sm"
                            className={dark ? "ring-1 ring-neutral-800" : "ring-1 ring-white"}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
