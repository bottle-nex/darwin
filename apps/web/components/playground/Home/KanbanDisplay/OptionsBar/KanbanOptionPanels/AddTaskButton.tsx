"use client";
import { IoPencilSharp } from "react-icons/io5";
import { LuChevronDown } from "react-icons/lu";
import { MdAdd, MdPlaylistAdd, MdUpload } from "react-icons/md";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import { useCreateIssueStore } from "@/store/issues/useCreateIssueStore";
import { useAddCustomColumnStore } from "@/store/kanban/useAddCustomColumnStore";

import OptionButton from "./OptionButton";

const TASK_OPTIONS = [
    { id: "issue", label: "New issue", icon: MdAdd },
    { id: "custom_column", label: "Add custom col", icon: MdPlaylistAdd },
    { id: "import", label: "Import issues", icon: MdUpload },
];

export default function AddTaskButton() {
    const openCreate = useCreateIssueStore((s) => s.open);
    const setAddColumnOpen = useAddCustomColumnStore((s) => s.setOpen);
    const onAddTask = () => openCreate({ board: "llm" });

    const handlers: Record<string, (() => void) | undefined> = {
        issue: onAddTask,
        custom_column: () => setAddColumnOpen(true),
    };

    return (
        <div className="flex items-center gap-1">
            <TooltipComponent delayDuration={1000} content="New issue" side="bottom">
                <OptionButton label="New issue" icon={IoPencilSharp} onClick={onAddTask} />
            </TooltipComponent>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <OptionButton label="More task options" icon={LuChevronDown} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    {TASK_OPTIONS.map((option) => {
                        const disabled = option.id === "import";
                        return (
                            <DropdownMenuItem
                                key={option.id}
                                disabled={disabled}
                                onSelect={handlers[option.id]}
                            >
                                <option.icon className="size-3.5 text-neutral-400" aria-hidden />
                                {option.label}
                                {disabled && (
                                    <span className="ml-auto text-[10px] text-neutral-500">
                                        Soon
                                    </span>
                                )}
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
