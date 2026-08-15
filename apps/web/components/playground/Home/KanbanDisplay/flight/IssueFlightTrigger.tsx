"use client";
import { useMemo, useState } from "react";
import { LuRadar } from "react-icons/lu";
import { MdCheck } from "react-icons/md";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { KanbanBoard } from "@/lib/kanban/KanbanBoard";
import type { KanbanStatus } from "@/types/kanban";
import { useIssueFlightStore } from "@/store/kanban/useIssueFlightStore";
import { useKanbanBoardStore } from "@/store/kanban/useKanbanBoardStore";
import { useKanbanOptionsStore } from "@/store/kanban/useKanbanOptionsStore";

/**
 * Stand-in for the future server-pushed status-change trigger: pick an issue and
 * a target status, then play the `IssueFlightOverlay` pickup animation. Only
 * issues currently rendered on the LLM board can be targeted, since the
 * animation locates them by DOM lookup — everything here is scoped to what's
 * actually on screen.
 */
export default function IssueFlightTrigger() {
    const [open, setOpen] = useState(false);
    const [issueSearchOpen, setIssueSearchOpen] = useState(false);
    const [issueSearch, setIssueSearch] = useState("");
    const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
    const [targetStatus, setTargetStatus] = useState<KanbanStatus | null>(null);
    const flightInProgress = useIssueFlightStore((s) => s.flight !== null);
    const start = useIssueFlightStore((s) => s.start);
    const board = useKanbanBoardStore((s) => s.board);
    const boardView = useKanbanOptionsStore((s) => s.boardView);
    const kanbanView = useKanbanOptionsStore((s) => s.kanbanView);

    const issues = useMemo(() => Object.values(board).flat(), [board]);
    const selectedIssue = issues.find((i) => i.id === selectedIssueId) ?? null;

    const query = issueSearch.trim().toLowerCase();
    const filteredIssues = query
        ? issues.filter(
              (i) =>
                  i.title.toLowerCase().includes(query) || i.number.toLowerCase().includes(query),
          )
        : issues;

    const statusOptions = KanbanBoard.COLUMNS.filter((c) => c.status !== selectedIssue?.status);
    const onBoardPage = boardView !== "custom" && kanbanView === "board";
    const canSubmit =
        Boolean(selectedIssue) && Boolean(targetStatus) && onBoardPage && !flightInProgress;

    const disabledReason = flightInProgress
        ? "An animation is already running."
        : !onBoardPage
          ? "Switch to Board view to run this."
          : null;

    function handleOpenChange(next: boolean) {
        setOpen(next);
        if (!next) {
            setSelectedIssueId(null);
            setTargetStatus(null);
            setIssueSearch("");
        }
    }

    function handleSubmit() {
        if (!selectedIssue || !targetStatus) return;
        setOpen(false);
        start(selectedIssue, targetStatus);
    }

    return (
        <>
            <Button
                type="button"
                variant="secondary"
                size="icon-lg"
                aria-label="Simulate a status trigger"
                className="fixed right-6 bottom-6 z-40 rounded-full"
                onClick={() => setOpen(true)}
            >
                <LuRadar className="size-4" aria-hidden />
            </Button>

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="border-white/10 bg-charcoal sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base text-neutral-100">
                            Simulate a status trigger
                        </DialogTitle>
                        <DialogDescription className="text-xs text-neutral-500">
                            Stands in for the server pushing a status change — plays the pickup
                            animation only, the board itself is unaffected.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4">
                        <div>
                            <Label className="text-neutral-300">Issue</Label>
                            <Popover open={issueSearchOpen} onOpenChange={setIssueSearchOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="unstyled"
                                        type="button"
                                        className="mt-1.5 flex w-full cursor-pointer items-center justify-between rounded-lg bg-[#171717] px-3 py-2 text-left text-sm text-neutral-200 shadow-[inset_0_2px_0_0_var(--color-edge)] hover:bg-[#1c1c1c]"
                                    >
                                        {selectedIssue ? (
                                            <span className="truncate">
                                                {selectedIssue.number} — {selectedIssue.title}
                                            </span>
                                        ) : (
                                            <span className="text-neutral-500">Search issues…</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    align="start"
                                    className="w-80 border-white/10 bg-charcoal p-0"
                                >
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            value={issueSearch}
                                            onValueChange={setIssueSearch}
                                            placeholder="Search by title or number…"
                                        />
                                        <CommandList>
                                            {filteredIssues.length === 0 && (
                                                <CommandEmpty>No issues found</CommandEmpty>
                                            )}
                                            <CommandGroup>
                                                {filteredIssues.map((issue) => (
                                                    <CommandItem
                                                        key={issue.id}
                                                        value={issue.id}
                                                        onSelect={() => {
                                                            setSelectedIssueId(issue.id);
                                                            setTargetStatus(null);
                                                            setIssueSearchOpen(false);
                                                        }}
                                                    >
                                                        <span className="min-w-0 flex-1 truncate">
                                                            <span className="text-neutral-500">
                                                                {issue.number}
                                                            </span>{" "}
                                                            {issue.title}
                                                        </span>
                                                        {issue.id === selectedIssueId && (
                                                            <MdCheck className="size-4 shrink-0 text-neutral-400" />
                                                        )}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div>
                            <Label className="text-neutral-300">Move to</Label>
                            <Select
                                value={targetStatus ?? undefined}
                                onValueChange={(v) => setTargetStatus(v as KanbanStatus)}
                                disabled={!selectedIssue}
                            >
                                <SelectTrigger className="mt-1.5 w-full">
                                    <SelectValue placeholder="Choose a column" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((col) => (
                                        <SelectItem key={col.status} value={col.status}>
                                            {col.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {disabledReason && (
                            <p className="text-xs text-amber-400">{disabledReason}</p>
                        )}

                        <Button
                            type="button"
                            size="sm"
                            disabled={!canSubmit}
                            onClick={handleSubmit}
                            className="self-end"
                        >
                            Trigger
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
