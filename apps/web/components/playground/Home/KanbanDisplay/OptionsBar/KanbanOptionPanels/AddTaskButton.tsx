"use client";
import { MdAdd, MdKeyboardArrowDown, MdPlaylistAdd, MdUpload } from "react-icons/md";
import { RiEdit2Fill } from "react-icons/ri";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import { useAddCustomColumnStore } from "@/store/kanban/useAddCustomColumnStore";
import { useIssueStore } from "@/store/issues/useIssueStore";
import OptionButton from "./OptionButton";

const TASK_OPTIONS = [
    { id: "issue", label: "New issue", icon: MdAdd },
    { id: "custom_column", label: "Add custom col", icon: MdPlaylistAdd },
    { id: "import", label: "Import issues", icon: MdUpload },
];

/** The toolbar's primary action: new issue, with the rarer creates behind a caret. */
export default function AddTaskButton() {
    const openCreate = useIssueStore((s) => s.openCreate);
    const setAddColumnOpen = useAddCustomColumnStore((s) => s.setOpen);
    const onAddTask = () => openCreate({ board: "llm" });

    const handlers: Record<string, (() => void) | undefined> = {
        issue: onAddTask,
        custom_column: () => setAddColumnOpen(true),
    };

    return (
        <div className="flex items-center">
            <TooltipComponent delayDuration={1000} content="New issue" side="bottom">
                <OptionButton label="New issue" icon={RiEdit2Fill} onClick={onAddTask} />
            </TooltipComponent>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <OptionButton label="More task options" icon={MdKeyboardArrowDown} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
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
