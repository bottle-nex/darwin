"use client";

import { CloseIcon } from "@trydarwin/ui/icons";
import { Command as CommandPrimitive } from "cmdk";
import { type KeyboardEvent, useRef, useState } from "react";

import PlaygroundAvatar, {
    initialOf,
    toneFor,
} from "@/components/playground/Core/components/PlaygroundAvatar";
import { Button } from "@/components/ui/button";
import { Command, CommandItem, CommandList } from "@/components/ui/command";
import { GHOST_FIELD } from "@/components/ui/fieldStyles";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { useProjectMembers } from "@/hooks/project/useProjectMembers";
import { cn } from "@/lib/utils";

export type InviteRecipients = { emails: string[]; userIds: string[] };

type InviteRecipientFieldProps = {
    projectId: string;
    excludedUserIds: string[];
    value: InviteRecipients;
    onChange: (next: InviteRecipients) => void;
    draft: string;
    onDraftChange: (draft: string) => void;
    onCommitDraft: () => void;
    atLimit: boolean;
};

/**
 * One field for both ways of inviting: type a name to pick someone already on the
 * project, or type an address to invite a stranger. Keeping them apart meant a
 * search box, a divider and a second input for what reads as a single decision.
 */
export default function InviteRecipientField({
    projectId,
    excludedUserIds,
    value,
    onChange,
    draft,
    onDraftChange,
    onCommitDraft,
    atLimit,
}: InviteRecipientFieldProps) {
    const anchorRef = useRef<HTMLDivElement>(null);
    const [dismissed, setDismissed] = useState(false);
    const { data: members } = useProjectMembers(projectId);

    const excluded = new Set(excludedUserIds);
    const query = draft.trim().toLowerCase();
    const selected = new Set(value.userIds);

    const available = (members ?? []).filter((member) => !excluded.has(member.id));
    const matches = query
        ? available.filter(
              (member) =>
                  !selected.has(member.id) &&
                  `${member.name ?? ""} ${member.email}`.toLowerCase().includes(query),
          )
        : [];

    const suggestionsOpen = matches.length > 0 && !dismissed && !atLimit;
    const chosen = available.filter((member) => selected.has(member.id));

    function addMember(userId: string) {
        onChange({ ...value, userIds: [...value.userIds, userId] });
        onDraftChange("");
    }

    function removeMember(userId: string) {
        onChange({ ...value, userIds: value.userIds.filter((id) => id !== userId) });
    }

    function removeEmail(email: string) {
        onChange({ ...value, emails: value.emails.filter((entry) => entry !== email) });
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === "Escape" && suggestionsOpen) {
            event.preventDefault();
            setDismissed(true);
            return;
        }
        // While the list is up, Enter belongs to whatever is highlighted in it.
        if (suggestionsOpen && event.key === "Enter") return;

        if (["Enter", ",", ";", "Tab"].includes(event.key) && draft.trim()) {
            event.preventDefault();
            onCommitDraft();
            return;
        }
        if (event.key !== "Backspace" || draft) return;

        if (value.emails.length) removeEmail(value.emails[value.emails.length - 1]);
        else if (value.userIds.length) removeMember(value.userIds[value.userIds.length - 1]);
    }

    const isEmpty = !chosen.length && !value.emails.length;

    return (
        <Popover open={suggestionsOpen}>
            <Command shouldFilter={false} className="h-auto overflow-visible bg-transparent">
                <PopoverAnchor asChild>
                    <div ref={anchorRef} className="flex w-full flex-wrap items-center gap-1.5">
                        {chosen.map((member) => (
                            <Chip
                                key={member.id}
                                label={member.name ?? member.email}
                                onRemove={() => removeMember(member.id)}
                                leading={
                                    <PlaygroundAvatar
                                        letter={initialOf(member.name, member.email)}
                                        src={member.image}
                                        tone={toneFor(member.id)}
                                    />
                                }
                            />
                        ))}

                        {value.emails.map((email) => (
                            <Chip key={email} label={email} onRemove={() => removeEmail(email)} />
                        ))}

                        <CommandPrimitive.Input
                            autoFocus
                            value={draft}
                            onValueChange={(next) => {
                                setDismissed(false);
                                onDraftChange(next);
                            }}
                            onKeyDown={handleKeyDown}
                            onBlur={onCommitDraft}
                            disabled={atLimit}
                            placeholder={isEmpty ? "Name or name@company.com" : ""}
                            className={cn(
                                GHOST_FIELD,
                                "h-9 min-w-56 flex-1 text-xl font-medium text-neutral-100 placeholder:text-neutral-600 disabled:cursor-not-allowed",
                            )}
                        />
                    </div>
                </PopoverAnchor>

                <PopoverContent
                    align="start"
                    sideOffset={8}
                    onOpenAutoFocus={(event) => event.preventDefault()}
                    onCloseAutoFocus={(event) => event.preventDefault()}
                    onInteractOutside={(event) => {
                        if (anchorRef.current?.contains(event.target as Node)) {
                            event.preventDefault();
                        }
                    }}
                    className="w-[var(--radix-popover-trigger-width)] overflow-hidden p-0"
                >
                    <CommandList className="max-h-56 p-1">
                        {matches.map((member) => (
                            <CommandItem
                                key={member.id}
                                value={member.id}
                                onSelect={() => addMember(member.id)}
                            >
                                <PlaygroundAvatar
                                    letter={initialOf(member.name, member.email)}
                                    src={member.image}
                                    tone={toneFor(member.id)}
                                    size="lg"
                                />
                                <span className="flex min-w-0 flex-1 flex-col">
                                    <span className="truncate text-[12px] font-medium text-neutral-100">
                                        {member.name ?? member.email}
                                    </span>
                                    {member.name && (
                                        <span className="truncate text-[10px] text-neutral-500">
                                            {member.email}
                                        </span>
                                    )}
                                </span>
                            </CommandItem>
                        ))}
                    </CommandList>
                </PopoverContent>
            </Command>
        </Popover>
    );
}

function Chip({
    label,
    leading,
    onRemove,
}: {
    label: string;
    leading?: React.ReactNode;
    onRemove: () => void;
}) {
    return (
        <span className="flex items-center gap-1.5 rounded-full bg-overlay/5 py-1 pr-1 pl-1.5 text-[12px] text-neutral-200">
            {leading}
            <span className="max-w-56 truncate">{label}</span>
            <Button
                variant="unstyled"
                type="button"
                onClick={onRemove}
                aria-label={`Remove ${label}`}
                className="flex size-4 cursor-pointer items-center justify-center rounded-full text-neutral-500 hover:bg-overlay/10 hover:text-neutral-100"
            >
                <CloseIcon className="size-3" />
            </Button>
        </span>
    );
}
