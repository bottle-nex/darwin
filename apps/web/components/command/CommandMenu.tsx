"use client";
import { CommandBackIcon } from "@trydarwin/ui/icons";
import { useMemo, useState } from "react";

import {
    Command,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import KeyCombo from "@/components/ui/KeyCombo";
import { useIssueActions } from "@/hooks/issues/useIssueActions";
import { useIssueIdentifier } from "@/hooks/issues/useIssueIdentifier";
import { isSearchableQuery, useGlobalSearch } from "@/hooks/search/useGlobalSearch";
import {
    comboToKeys,
    COMMAND_ENTRIES,
    isCommandAvailable,
} from "@/hooks/shortcuts/usePlaygroundShortcuts";
import { useSpaceCommandActions } from "@/hooks/spaces/useSpaceActions";
import { useMemberCommandActions } from "@/hooks/team/useMemberCommandActions";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";
import { useCommandContextStore } from "@/store/command/useCommandContextStore";
import { useCommandMenuStore } from "@/store/command/useCommandMenuStore";
import { useIssueSelectionStore } from "@/store/issues/useIssueSelectionStore";
import { useSpaceSelectionStore } from "@/store/space/useSpaceSelectionStore";
import { useMemberSelectionStore } from "@/store/team/useMemberSelectionStore";
import {
    COMMAND_KIND_ORDER,
    type CommandEntry,
    CommandKind,
    type CommandPage,
    isMemberCommandPage,
    isSpaceCommandPage,
} from "@/types/command.type";

import { commandEntryValue, filterCommandGroups } from "./commandFilter";
import CommandIssuePage, { ISSUE_PAGE_TITLE } from "./CommandIssuePage";
import CommandMemberPage, { MEMBER_PAGE_TITLE } from "./CommandMemberPage";
import { commandMenuView } from "./commandMenuView";
import CommandSearchResults from "./CommandSearchResults";
import CommandSpacePage, { SPACE_PAGE_TITLE } from "./CommandSpacePage";

const SEARCH_DEBOUNCE_MS = 200;
const EMPTY_SELECTION: string[] = [];

function pageTitle(page: CommandPage) {
    if (isSpaceCommandPage(page)) return SPACE_PAGE_TITLE[page];
    if (isMemberCommandPage(page)) return MEMBER_PAGE_TITLE[page];
    return ISSUE_PAGE_TITLE[page];
}

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
    const spaceId = useCommandContextStore((s) => s.spaceId);
    const teamId = useCommandContextStore((s) => s.teamId);
    const page = useCommandMenuStore((s) => s.page);
    const setPage = useCommandMenuStore((s) => s.setPage);
    const [query, setQuery] = useState("");

    const identifier = useIssueIdentifier();
    const selectedIds = useIssueSelectionStore((s) => s.ids);
    const actions = useIssueActions(selectedIds.length ? selectedIds : issueId);

    const selectedSpaceIds = useSpaceSelectionStore((s) => s.ids);
    const spaceTargets = useMemo(
        () => (selectedSpaceIds.length ? selectedSpaceIds : spaceId ? [spaceId] : []),
        [selectedSpaceIds, spaceId],
    );
    const spaceActions = useSpaceCommandActions(spaceTargets);

    const memberSelectionIds = useMemberSelectionStore((s) => s.ids);
    // Member commands only mean anything on the team pane, so off it the selection reads empty.
    const selectedMemberKeys = teamId ? memberSelectionIds : EMPTY_SELECTION;
    const memberActions = useMemberCommandActions({
        selectedKeys: selectedMemberKeys,
        teamId,
        projectId: projectId ?? undefined,
    });

    const context = useMemo(
        () => ({ orgSlug, projectId, issueId, spaceId, teamId }),
        [orgSlug, projectId, issueId, spaceId, teamId],
    );

    const availableGroups = useMemo(
        () =>
            COMMAND_KIND_ORDER.map((kind) => ({
                kind,
                entries: COMMAND_ENTRIES.filter(
                    (entry) =>
                        entry.kind === kind &&
                        entry.combo !== "mod+k" &&
                        (kind !== CommandKind.Issue ||
                            Boolean(issueId) ||
                            selectedIds.length > 0) &&
                        (kind !== CommandKind.Space || spaceTargets.length > 0) &&
                        (kind !== CommandKind.Member || selectedMemberKeys.length > 0),
                ),
            })).filter((group) => group.entries.length > 0),
        [issueId, selectedIds.length, spaceTargets.length, selectedMemberKeys.length],
    );

    const groups = useMemo(
        () => filterCommandGroups(availableGroups, query),
        [availableGroups, query],
    );

    const searchQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS).trim();
    const canSearch = !page && Boolean(projectId);
    const searchArmed = canSearch && isSearchableQuery(query.trim());
    const searchSettled = canSearch && isSearchableQuery(searchQuery);
    const search = useGlobalSearch(projectId, searchQuery, searchSettled);
    const searchResult = searchSettled ? search.data : undefined;
    const { showSearchGroups, showNoResults } = commandMenuView({
        commandGroupCount: groups.length,
        searchArmed,
        searchSettled,
        hasResult: Boolean(searchResult),
        hasHits: Boolean(searchResult?.issues.length || searchResult?.messages.length),
        isError: searchSettled && search.isError,
    });

    function back() {
        setPage(null);
        setQuery("");
    }

    function run(entry: CommandEntry) {
        if (!isCommandAvailable(entry, context)) return;
        if (!entry.opensPage) onDone();
        setQuery("");
        entry.run();
    }

    return (
        <Command
            loop
            shouldFilter={page !== null}
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
                    placeholder={page ? `${pageTitle(page)}...` : "Type a command or search..."}
                    className="text-[14px]"
                    trailing={
                        page ? (
                            <button
                                type="button"
                                onClick={back}
                                className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-neutral-500 hover:bg-white/5 hover:text-neutral-300"
                            >
                                <CommandBackIcon className="size-3" aria-hidden />
                                Back
                            </button>
                        ) : null
                    }
                />
            </div>

            {selectedMemberKeys.length ? (
                <CommandTargetHeader
                    count={memberActions.count}
                    noun={memberActions.onlyInvites ? "invite" : "member"}
                    title={memberActions.soleTarget}
                />
            ) : spaceTargets.length ? (
                <CommandTargetHeader
                    count={spaceActions.count}
                    noun="space"
                    title={spaceActions.space?.name}
                />
            ) : (
                <CommandTargetHeader
                    count={actions.count}
                    noun="issue"
                    title={actions.issue?.title}
                    lead={actions.issue ? identifier(actions.issue.number) : undefined}
                />
            )}

            {page ? (
                isSpaceCommandPage(page) ? (
                    <CommandSpacePage page={page} actions={spaceActions} onDone={onDone} />
                ) : isMemberCommandPage(page) ? (
                    <CommandMemberPage page={page} actions={memberActions} onDone={onDone} />
                ) : (
                    <CommandIssuePage page={page} actions={actions} onDone={onDone} />
                )
            ) : (
                <CommandList
                    data-lenis-prevent
                    className="no-scrollbar max-h-[min(60vh,26rem)] px-2 pt-1 pb-2"
                >
                    {showNoResults && (
                        <div className="py-6 text-center text-sm text-neutral-500">No results.</div>
                    )}
                    {groups.map((group) => (
                        <CommandGroup key={group.kind} heading={group.kind}>
                            {group.entries.map((entry) => {
                                const available = isCommandAvailable(entry, context);
                                return (
                                    <CommandItem
                                        key={entry.combo}
                                        value={commandEntryValue(entry)}
                                        disabled={!available}
                                        onSelect={() => run(entry)}
                                        className={cn(
                                            "justify-between p-2.5 text-[13.5px]",
                                            entry.destructive &&
                                                "text-rose-400 hover:text-rose-400!",
                                        )}
                                    >
                                        <span className="flex min-w-0 items-center gap-2">
                                            <entry.icon
                                                className={cn(
                                                    "size-4 text-neutral-400",
                                                    entry.destructive && "text-rose-400!",
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
                    {showSearchGroups && (
                        <CommandSearchResults
                            result={searchResult}
                            isFetching={search.isFetching}
                            isError={searchSettled && search.isError}
                            onDone={onDone}
                        />
                    )}
                </CommandList>
            )}
        </Command>
    );
}

/** What the menu is about to act on: one thing by name, or how many are selected. */
function CommandTargetHeader({
    count,
    noun,
    title,
    lead,
}: {
    count: number;
    noun: string;
    title?: string;
    lead?: string;
}) {
    if (!count) return null;
    return (
        <div className="flex items-center gap-2 px-4 pt-3 text-[12.5px] text-neutral-500">
            {count > 1 ? (
                <span className="font-medium text-neutral-400">
                    {count} {noun}s selected
                </span>
            ) : (
                <>
                    {lead && (
                        <>
                            <span className="shrink-0 font-medium">{lead}</span>
                            <span aria-hidden>·</span>
                        </>
                    )}
                    <span className="truncate">{title}</span>
                </>
            )}
        </div>
    );
}
