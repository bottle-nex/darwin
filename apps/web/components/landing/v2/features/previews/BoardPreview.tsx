import { cn } from "@/lib/utils";
import { COLUMNS } from "@/components/playground/Home/KanbanDisplay/data";
import CardRenderer from "@/components/playground/Home/KanbanDisplay/cards/CardRenderer";
import { KanbanStatus, type Issue } from "@/components/playground/Home/KanbanDisplay/types";

/**
 * Self-contained sample card for the landing preview. The live LLM board
 * (`INITIAL_BOARD`) now starts empty and hydrates from the agent flow, so the
 * landing page keeps its own static issue rather than reading board state.
 */
const SAMPLE_IN_PROGRESS: Issue = {
    id: "preview-1",
    number: "MTC-128",
    title: "Fix flaky auth redirect on email-OTP verify",
    project: "trymatcha/web",
    label: { name: "bug", className: "bg-rose-500/15 text-rose-300" },
    priority: "high",
    agent: "Opus 4.8",
    assignees: [{ id: "a1", name: "Maya", tone: "purple" }],
    comments: 3,
    status: KanbanStatus.InProgress,
    step: "Running test suite on runner",
    runner: "runner-eph-7f2a",
};

export default function BoardPreview() {
    const inProgress = SAMPLE_IN_PROGRESS;
    return (
        <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap gap-1.5">
                {COLUMNS.slice(0, 3).map((column) => {
                    const { icon: Icon, title, titleBox, status } = column;
                    return (
                        <span
                            key={status}
                            className={cn(
                                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                                titleBox,
                            )}
                        >
                            <Icon className="size-2.5" aria-hidden />
                            {title}
                        </span>
                    );
                })}
            </div>
            {/* The in-progress card lights up while the agent works it. */}
            <div className="rounded-lg transition-all duration-300 motion-reduce:transition-none">
                <CardRenderer issue={inProgress} />
            </div>
        </div>
    );
}
