"use client";
import {
    AddIcon,
    BoardViewIcon,
    FilterIcon,
    KanbanColumnsIcon,
    OptionsMenuIcon,
} from "@trymatcha/ui/icons";

import type { KanbanOptionView } from "@/types/project";

import SettingsTilePicker, { type TileOption } from "./SettingsTilePicker";

const PREVIEW_SHELL =
    "flex h-11 items-center justify-end gap-1 rounded-[8px] border border-snow/5 bg-ink/40 px-2";

const PREVIEW_CONTROL =
    "flex items-center gap-1 rounded-[4px] bg-snow/8 px-1.5 py-1 text-[9px] text-neutral-300";

function PreviewControl({ icon: Icon, label }: { icon: typeof FilterIcon; label: string }) {
    return (
        <span className={PREVIEW_CONTROL}>
            <Icon className="size-2.5" aria-hidden />
            {label}
        </span>
    );
}

function PreviewAddTask() {
    return (
        <span className="flex items-center gap-1 rounded-[4px] bg-primary/70 px-1.5 py-1 text-[9px] text-ink">
            <AddIcon className="size-2.5" aria-hidden />
            Add
        </span>
    );
}

function FlatPreview() {
    return (
        <div className={PREVIEW_SHELL}>
            <PreviewControl icon={FilterIcon} label="Filter" />
            <PreviewControl icon={KanbanColumnsIcon} label="Focus" />
            <PreviewControl icon={BoardViewIcon} label="View" />
            <PreviewAddTask />
        </div>
    );
}

function GroupedPreview() {
    return (
        <div className={PREVIEW_SHELL}>
            <PreviewControl icon={OptionsMenuIcon} label="Options" />
            <PreviewAddTask />
        </div>
    );
}

const OPTIONS_BAR_VIEWS: TileOption<KanbanOptionView>[] = [
    {
        id: "FLAT",
        label: "Flat",
        description: "Filter, Focus, and View each get their own button on the board toolbar.",
        preview: FlatPreview,
    },
    {
        id: "GROUPED",
        label: "Grouped",
        description: "Those three collapse into a single Options menu, for a cleaner toolbar.",
        preview: GroupedPreview,
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
        <SettingsTilePicker
            name="kanban-option-view"
            options={OPTIONS_BAR_VIEWS}
            value={value}
            onChange={onChange}
        />
    );
}
