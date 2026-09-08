"use client";

import { ProjectRole } from "@trydarwin/types";
import { BreadcrumbSeparatorIcon } from "@trydarwin/ui/icons";
import * as React from "react";

import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import { CapsuleTrigger } from "@/components/playground/Issue/Capsule";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import DialogSubmitButton, { handleDialogSubmitKey } from "@/components/ui/DialogSubmitButton";
import { GHOST_FIELD } from "@/components/ui/fieldStyles";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import InviteRecipientField, { type InviteRecipients } from "./InviteRecipientField";

const PROJECT_ROLES = Object.values(ProjectRole);

const ROLE_HINTS: Record<ProjectRole, string> = {
    Admin: "Full control, including members and settings.",
    Maintain: "Manage the project without destructive settings.",
    Write: "Create and update issues and code.",
    Triage: "Organize and manage issues without write access.",
    Read: "View the project only.",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENTS = 50;

function isValidEmail(value: string) {
    return EMAIL_RE.test(value.trim().toLowerCase());
}

/** Tiny debounce so the "looks invalid" hint doesn't flicker on every keystroke. */
function useDebouncedValue<T>(value: T, delayMs: number) {
    const [debounced, setDebounced] = React.useState(value);
    React.useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(id);
    }, [value, delayMs]);
    return debounced;
}

type InviteToTeamDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgName: string;
    projectId: string;
    teamName: string;
    teamMemberIds: string[];
    /** You own this — wire it to your invite mutation. */
    onSubmit: (payload: {
        emails: string[];
        userIds: string[];
        role: ProjectRole;
        message?: string;
    }) => void;
    isPending?: boolean;
};

export default function InviteToTeamDialog({
    open,
    onOpenChange,
    orgName,
    projectId,
    teamName,
    teamMemberIds,
    onSubmit,
    isPending = false,
}: InviteToTeamDialogProps) {
    if (!open) return null;
    return (
        <Dialog open onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    (event.currentTarget as HTMLElement).focus();
                }}
                className="flex flex-col max-h-[80vh] min-h-[40vh] w-150 max-w-none sm:max-w-none p-0 gap-0 overflow-hidden rounded-3xl"
            >
                <DialogTitle className="sr-only">Invite members</DialogTitle>
                <InviteForm
                    orgName={orgName}
                    projectId={projectId}
                    teamName={teamName}
                    teamMemberIds={teamMemberIds}
                    onSubmit={onSubmit}
                    isPending={isPending}
                />
            </DialogContent>
        </Dialog>
    );
}

function InviteForm({
    orgName,
    projectId,
    teamName,
    teamMemberIds,
    onSubmit,
    isPending,
}: Omit<InviteToTeamDialogProps, "open" | "onOpenChange"> & { isPending: boolean }) {
    const [recipients, setRecipients] = React.useState<InviteRecipients>({
        emails: [],
        userIds: [],
    });
    const [draft, setDraft] = React.useState("");
    const [message, setMessage] = React.useState("");
    const [role, setRole] = React.useState<ProjectRole>(ProjectRole.Write);
    const [roleOpen, setRoleOpen] = React.useState(false);

    const debouncedDraft = useDebouncedValue(draft, 300);
    const draftLooksInvalid =
        debouncedDraft.includes("@") && !isValidEmail(debouncedDraft) && draft.includes("@");
    const recipientCount = recipients.emails.length + recipients.userIds.length;
    const atLimit = recipientCount >= MAX_RECIPIENTS;

    const commitDraft = React.useCallback(() => {
        const candidates = draft
            .split(/[\s,;]+/)
            .map((entry) => entry.trim().toLowerCase())
            .filter(Boolean);
        if (!candidates.length) return;

        setRecipients((prev) => {
            const seen = new Set(prev.emails);
            const next = [...prev.emails];
            for (const email of candidates) {
                if (next.length + prev.userIds.length >= MAX_RECIPIENTS) break;
                if (isValidEmail(email) && !seen.has(email)) {
                    seen.add(email);
                    next.push(email);
                }
            }
            return next.length === prev.emails.length ? prev : { ...prev, emails: next };
        });

        if (candidates.every(isValidEmail)) setDraft("");
    }, [draft]);

    function handleSubmit() {
        // Fold a still-typed valid email into the batch before sending.
        const canAddDraft = isValidEmail(draft) && !atLimit;
        const pending = canAddDraft ? [draft.trim().toLowerCase()] : [];
        const finalEmails = [...new Set([...recipients.emails, ...pending])].slice(
            0,
            MAX_RECIPIENTS - recipients.userIds.length,
        );
        if (!finalEmails.length && !recipients.userIds.length) return;
        onSubmit({
            emails: finalEmails,
            userIds: recipients.userIds,
            role,
            message: message.trim() || undefined,
        });
    }

    const hasEmailRecipients = recipients.emails.length > 0 || (isValidEmail(draft) && !atLimit);
    const canSubmit = !isPending && (recipients.userIds.length > 0 || hasEmailRecipients);
    const submitLabel =
        recipients.userIds.length > 0 && hasEmailRecipients
            ? "Add and invite"
            : recipients.userIds.length > 0
              ? "Add members"
              : "Send invites";

    return (
        <main
            className="flex min-h-0 min-w-0 flex-1 flex-col justify-between *:px-6"
            onKeyDown={(event) => handleDialogSubmitKey(event, handleSubmit)}
        >
            <section className="flex flex-col items-start gap-y-3 pt-4 pb-2">
                <div className="flex items-center justify-start gap-x-1 text-snow text-xs">
                    <PlaygroundAvatar
                        letter={orgName.slice(0, 2)}
                        tone="emerald"
                        className="uppercase"
                    />
                    <span>
                        <BreadcrumbSeparatorIcon />
                    </span>
                    <span className="text-sm">Invite to {teamName}</span>
                </div>

                <InviteRecipientField
                    projectId={projectId}
                    excludedUserIds={teamMemberIds}
                    value={recipients}
                    onChange={setRecipients}
                    draft={draft}
                    onDraftChange={setDraft}
                    onCommitDraft={commitDraft}
                    atLimit={atLimit}
                />

                {(atLimit || draftLooksInvalid) && (
                    <p className="text-[11px] text-amber-400">
                        {atLimit
                            ? `Maximum of ${MAX_RECIPIENTS} recipients reached.`
                            : "That doesn't look like a valid email."}
                    </p>
                )}
            </section>

            <section
                data-lenis-prevent
                className="no-scrollbar flex-1 min-h-0 overflow-y-auto pb-4"
            >
                <Textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={500}
                    placeholder="Add a short note to the invite…"
                    className={cn(GHOST_FIELD, "w-full text-base leading-[1.65] text-neutral-200")}
                />
            </section>

            <section className="flex items-center justify-between gap-x-3 pb-4">
                <Popover open={roleOpen} onOpenChange={setRoleOpen}>
                    <PopoverTrigger asChild>
                        <CapsuleTrigger>{role}</CapsuleTrigger>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-64 p-1">
                        <div className="flex flex-col gap-0.5">
                            {PROJECT_ROLES.map((option) => (
                                <Button
                                    variant="unstyled"
                                    key={option}
                                    type="button"
                                    onClick={() => {
                                        setRole(option);
                                        setRoleOpen(false);
                                    }}
                                    className={cn(
                                        "flex cursor-pointer flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left transition-colors",
                                        option === role ? "bg-white/8" : "hover:bg-white/5",
                                    )}
                                >
                                    <span className="text-[13px] text-neutral-200">{option}</span>
                                    <span className="text-[11px] text-neutral-500">
                                        {ROLE_HINTS[option]}
                                    </span>
                                </Button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                <DialogSubmitButton
                    label={submitLabel}
                    onClick={handleSubmit}
                    loading={isPending}
                    disabled={!canSubmit}
                />
            </section>
        </main>
    );
}
