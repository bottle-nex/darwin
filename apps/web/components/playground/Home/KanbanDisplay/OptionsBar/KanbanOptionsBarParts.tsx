"use client";
import {
    MdAdd,
    MdKeyboardArrowDown,
    MdPlaylistAdd,
    MdUpload,
    MdVerticalSplit,
    MdViewKanban,
} from "react-icons/md";
import { type IconType } from "react-icons";
import HeroBuddy from "@/components/landing/v2/HeroBuddy";
import { DropdownMenu } from "radix-ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import { useKanbanOptionsStore } from "@/store/kanban/useKanbanOptionsStore";
import { useAddCustomColumnStore } from "@/store/kanban/useAddCustomColumnStore";
import { useCreateOrEditIssueStore } from "@/store/issues/useCreateOrEditIssueStore";
import type { BoardView } from "@/types/kanban";

const BOARD_VIEWS: {
    id: BoardView;
    label: string;
    hint: string;
    icon?: IconType;
    mascot?: boolean;
}[] = [
    { id: "llm", label: "Agent", hint: "Columns run by the matcha agent", mascot: true },
    { id: "custom", label: "My Board", hint: "Columns your team created", icon: MdViewKanban },
    { id: "default", label: "Split", hint: "Both boards side by side", icon: MdVerticalSplit },
];

const TASK_OPTIONS = [
    { id: "issue", label: "New issue", icon: MdAdd },
    { id: "custom_column", label: "Add custom col", icon: MdPlaylistAdd },
    { id: "import", label: "Import issues", icon: MdUpload },
];

export const OPTIONS_BAR_SHELL =
    "flex h-10 shrink-0 items-center justify-between gap-2 border-b border-white/5 px-3";

export const MENU_CONTENT_CLASS =
    "z-50 w-52 origin-(--radix-dropdown-menu-content-transform-origin) rounded-lg border border-neutral-800 bg-charcoal p-1 shadow-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95";

export const MENU_ITEM_CLASS =
    "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-neutral-300 outline-none select-none";

export function BoardViewTabs() {
    const boardView = useKanbanOptionsStore((s) => s.boardView);
    const setBoardView = useKanbanOptionsStore((s) => s.setBoardView);

    return (
        <div className="flex shrink-0 items-center gap-0.5">
            {BOARD_VIEWS.map((v) => (
                <TooltipComponent delayDuration={1000} key={v.id} content={v.hint} side="bottom">
                    <Button
                        variant="unstyled"
                        type="button"
                        onClick={() => setBoardView(v.id)}
                        className={cn(
                            "flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2 text-[12px] font-medium transition-colors",
                            boardView === v.id
                                ? "bg-white/10 text-neutral-100"
                                : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200",
                        )}
                    >
                        {v.mascot ? (
                            <HeroBuddy move={false} className="size-4" />
                        ) : (
                            v.icon && <v.icon className="size-3.5" aria-hidden />
                        )}
                        {v.label}
                    </Button>
                </TooltipComponent>
            ))}
        </div>
    );
}

/** Split button: primary "Add Task" + a chevron that opens a menu. */
export function AddTaskButton() {
    const openCreate = useCreateOrEditIssueStore((s) => s.openCreate);
    const setAddColumnOpen = useAddCustomColumnStore((s) => s.setOpen);
    const onAddTask = () => openCreate({ board: "llm" });

    const handlers: Record<string, (() => void) | undefined> = {
        issue: onAddTask,
        custom_column: () => setAddColumnOpen(true),
    };

    return (
        <div className="ml-1 flex items-center overflow-hidden rounded-sm bg-neutral-100 text-neutral-900">
            <Button
                variant="tertiary"
                type="button"
                onClick={onAddTask}
                className="flex h-6 cursor-pointer items-center px-2 text-[11.5px] font-medium hover:bg-black/5 rounded-l-[1px] rounded-r-none"
            >
                Add Task
            </Button>
            <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                    <Button
                        variant="tertiary"
                        type="button"
                        aria-label="More task options"
                        className="flex h-6 cursor-pointer items-center px-1 hover:bg-black/5 rounded-none"
                    >
                        <MdKeyboardArrowDown className="size-3.5" aria-hidden />
                    </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                    <DropdownMenu.Content align="end" sideOffset={6} className={MENU_CONTENT_CLASS}>
                        {TASK_OPTIONS.map((option) => {
                            const disabled = option.id === "import";
                            return (
                                <DropdownMenu.Item
                                    key={option.id}
                                    disabled={disabled}
                                    onSelect={handlers[option.id]}
                                    className={cn(
                                        MENU_ITEM_CLASS,
                                        disabled
                                            ? "cursor-not-allowed opacity-40"
                                            : "cursor-pointer data-highlighted:bg-white/5 data-highlighted:text-neutral-100",
                                    )}
                                >
                                    <option.icon
                                        className="size-3.5 text-neutral-400"
                                        aria-hidden
                                    />
                                    {option.label}
                                    {disabled && (
                                        <span className="ml-auto text-[10px] text-neutral-500">
                                            Soon
                                        </span>
                                    )}
                                </DropdownMenu.Item>
                            );
                        })}
                    </DropdownMenu.Content>
                </DropdownMenu.Portal>
            </DropdownMenu.Root>
        </div>
    );
}
