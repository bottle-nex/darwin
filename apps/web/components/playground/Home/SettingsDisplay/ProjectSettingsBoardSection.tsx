"use client";
import { cn } from "@/lib/utils";
import type { KanbanOptionView } from "@/types/project";

const GLYPH = "rounded-[2px] bg-neutral-700 transition-colors group-has-checked:bg-neutral-500";

const PREVIEW_SHELL =
    "flex h-11 items-center justify-between rounded-md border border-white/5 bg-black/30 px-2";

function PreviewTabs() {
    return (
        <div className="flex items-center gap-1">
            <div className="h-1.5 w-4 rounded-[2px] bg-neutral-500 transition-colors group-has-checked:bg-neutral-300" />
            <div className={cn(GLYPH, "h-1.5 w-6")} />
            <div className={cn(GLYPH, "h-1.5 w-4")} />
        </div>
    );
}

function PreviewAddTask() {
    return <div className="h-2 w-5 rounded-[2px] bg-primary/70" />;
}

function FlatPreview() {
    return (
        <div className={PREVIEW_SHELL}>
            <PreviewTabs />
            <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className={cn(GLYPH, "size-1.5")} />
                ))}
                <PreviewAddTask />
            </div>
        </div>
    );
}

function GroupedPreview() {
    return (
        <div className={PREVIEW_SHELL}>
            <PreviewTabs />
            <div className="flex items-center gap-1">
                <div className={cn(GLYPH, "h-2 w-8 rounded-full")} />
                <PreviewAddTask />
            </div>
        </div>
    );
}

const OPTIONS_BAR_VIEWS: {
    id: KanbanOptionView;
    label: string;
    description: string;
    Preview: () => React.ReactElement;
}[] = [
    {
        id: "FLAT",
        label: "Flat",
        description: "Every control sits on the bar.",
        Preview: FlatPreview,
    },
    {
        id: "GROUPED",
        label: "Grouped",
        description: "Controls collapse into one menu.",
        Preview: GroupedPreview,
    },
];

export default function ProjectSettingsBoardSection({
    value,
    onChange,
}: {
    value: KanbanOptionView;
    onChange: (view: KanbanOptionView) => void;
}) {
    return (
        <div className="flex flex-col gap-4">
            <div>
                <span className="text-[12px] text-neutral-300">Options bar</span>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                    {OPTIONS_BAR_VIEWS.map((view) => (
                        <label
                            key={view.id}
                            className="group cursor-pointer rounded-lg border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10 has-checked:border-primary/40 has-checked:bg-primary/10 has-disabled:cursor-not-allowed has-disabled:opacity-60 has-focus-visible:ring-2 has-focus-visible:ring-primary/40"
                        >
                            <input
                                type="radio"
                                name="kanban-option-view"
                                className="sr-only"
                                value={view.id}
                                checked={value === view.id}
                                onChange={() => onChange(view.id)}
                            />
                            <view.Preview />
                            <div className="mt-2 flex items-center gap-1.5 px-0.5">
                                <span className="size-3 rounded-full border border-white/20 transition-colors group-has-checked:border-primary group-has-checked:bg-primary/40" />
                                <span className="text-[12px] font-medium text-neutral-300 transition-colors group-has-checked:text-neutral-100">
                                    {view.label}
                                </span>
                            </div>
                            <p className="mt-1 px-0.5 text-[11px] text-neutral-500">
                                {view.description}
                            </p>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}
