"use client";
import { useMemo, useState } from "react";
import { HiOutlineArrowLeft } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import KeyCombo from "@/components/ui/KeyCombo";
import { useCommandMenuStore } from "@/store/command/useCommandMenuStore";
import { useCommandContextStore } from "@/store/command/useCommandContextStore";
import { useIssueActions } from "@/hooks/issues/useIssueActions";
import {
    COMMAND_ENTRIES,
    comboToKeys,
    isCommandAvailable,
} from "@/hooks/shortcuts/usePlaygroundShortcuts";
import { COMMAND_KIND_ORDER, CommandKind, type CommandEntry } from "@/types/command.type";
import CommandIssuePage, { ISSUE_PAGE_TITLE } from "./CommandIssuePage";

export default function CommandMenu() {
    const isOpen = useCommandMenuStore((s) => s.isOpen);
    const close = useCommandMenuStore((s) => s.close);

    if (!isOpen) return null;
    return (
        <Dialog open onOpenChange={(next) => !next && close()}>
            <DialogContent
                showCloseButton={false}
                className={cn(
                    "top-[18%] w-180 max-w-[calc(100%-2rem)] translate-y-0 sm:max-w-none",
                    "gap-0 overflow-hidden rounded-2xl border-white/10 p-0",
                )}
            >
                <DialogTitle className="sr-only">Command menu</DialogTitle>
                <CommandMenuBody onDone={close} />
            </DialogContent>
        </Dialog>
    );
}

function CommandMenuBody({ onDone }: { onDone: () => void }) {
    const orgSlug = useCommandContextStore((s) => s.orgSlug);
    const projectId = useCommandContextStore((s) => s.projectId);
    const issueId = useCommandContextStore((s) => s.issueId);
    const page = useCommandMenuStore((s) => s.page);
    const setPage = useCommandMenuStore((s) => s.setPage);
    const [query, setQuery] = useState("");

    const actions = useIssueActions(issueId);
    const context = useMemo(() => ({ orgSlug, projectId, issueId }), [orgSlug, projectId, issueId]);

    const groups = useMemo(
        () =>
            COMMAND_KIND_ORDER.map((kind) => ({
                kind,
                entries: COMMAND_ENTRIES.filter(
                    (entry) =>
                        entry.kind === kind &&
                        entry.combo !== "mod+k" &&
                        (kind !== CommandKind.Issue || Boolean(issueId)),
                ),
            })).filter((group) => group.entries.length > 0),
        [issueId],
    );

    function back() {
        setPage(null);
        setQuery("");
    }

    function run(entry: CommandEntry) {
        if (!isCommandAvailable(entry, context)) return;
        const opensPage = entry.kind === CommandKind.Issue;
        if (!opensPage) onDone();
        setQuery("");
        entry.run();
    }

    return (
        <Command
            loop
            className="bg-transparent"
            onKeyDown={(event) => {
                if (!page) return;
                if (event.key === "Escape" || (event.key === "Backspace" && query === "")) {
                    event.preventDefault();
                    event.stopPropagation();
                    back();
                }
            }}
        >
            <div className="px-1.5 pt-3">
                <CommandInput
                    autoFocus
                    border={false}
                    value={query}
                    onValueChange={setQuery}
                    placeholder={
                        page ? `${ISSUE_PAGE_TITLE[page]}...` : "Type a command or search..."
                    }
                    className="text-[14px]"
                    trailing={
                        page ? (
                            <button
                                type="button"
                                onClick={back}
                                className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-neutral-500 hover:bg-white/5 hover:text-neutral-300"
                            >
                                <HiOutlineArrowLeft className="size-3" aria-hidden />
                                Back
                            </button>
                        ) : null
                    }
                />
            </div>

            <IssueContextHeader title={actions.issue?.title} number={actions.issue?.number} />

            {page ? (
                <CommandIssuePage page={page} actions={actions} onDone={onDone} />
            ) : (
                <CommandList
                    data-lenis-prevent
                    className="no-scrollbar max-h-[min(60vh,26rem)] px-2 pt-1 pb-2"
                >
                    <CommandEmpty>No matching commands.</CommandEmpty>
                    {groups.map((group) => (
                        <CommandGroup key={group.kind} heading={group.kind}>
                            {group.entries.map((entry) => {
                                const available = isCommandAvailable(entry, context);
                                return (
                                    <CommandItem
                                        key={entry.combo}
                                        value={`${entry.kind} ${entry.label} ${entry.combo}`}
                                        disabled={!available}
                                        onSelect={() => run(entry)}
                                        className={cn(
                                            "justify-between p-2.5 text-[13.5px]",
                                            entry.destructive && "text-rose-300/90",
                                        )}
                                    >
                                        <span className="flex min-w-0 items-center gap-2">
                                            <entry.icon
                                                className={cn(
                                                    "size-4 text-neutral-400",
                                                    entry.destructive && "text-rose-400/80",
                                                )}
                                                aria-hidden
                                            />
                                            <span className="truncate">{entry.label}</span>
                                        </span>
                                        <KeyCombo keys={comboToKeys(entry.combo)} />
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    ))}
                </CommandList>
            )}
        </Command>
    );
}

function IssueContextHeader({ title, number }: { title?: string; number?: number }) {
    if (!title) return null;
    return (
        <div className="flex items-center gap-2 px-4 pt-3 text-[12.5px] text-neutral-500">
            <span className="shrink-0 font-medium">#{number}</span>
            <span aria-hidden>·</span>
            <span className="truncate">{title}</span>
        </div>
    );
}
