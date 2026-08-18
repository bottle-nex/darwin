"use client";

import * as React from "react";
import { MdClose, MdOutlineKeyboardArrowRight } from "react-icons/md";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GHOST_FIELD } from "@/components/ui/fieldStyles";
import { CapsuleTrigger } from "@/components/playground/Issue/Capsule";
import PlaygroundAvatar from "@/components/playground/Core/components/PlaygroundAvatar";
import { ProjectRole } from "@trymatcha/types";
import { cn } from "@/lib/utils";

const PROJECT_ROLES = Object.values(ProjectRole);

const ROLE_HINTS: Record<ProjectRole, string> = {
    Admin: "Full control, including members and settings.",
    Maintain: "Manage the project without destructive settings.",
    Write: "Create and update issues and code.",
    Triage: "Organize and manage issues without write access.",
    Read: "View the project only.",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAILS = 50;

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

type Sender = {
    name?: string | null;
    email?: string | null;
    image?: string | null;
};

type InviteToTeamDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Who the invite is from — pull from the session in the parent. */
    sender: Sender;
    /** Context shown to the inviter so they know what they're inviting into. */
    orgName: string;
    projectName: string;
    teamName: string;
    /** You own this — wire it to your invite mutation. */
    onSubmit: (payload: { emails: string[]; role: ProjectRole; message?: string }) => void;
    isPending?: boolean;
};

export default function InviteToTeamDialog({
    open,
    onOpenChange,
    sender,
    orgName,
    projectName,
    teamName,
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
                className={cn(
                    "flex flex-col max-h-[80vh] min-h-[40vh] w-150 max-w-none sm:max-w-none p-0 gap-0 overflow-hidden",
                    "bg-charcoal rounded-3xl",
                )}
            >
                <DialogTitle className="sr-only">Invite members</DialogTitle>
                <InviteForm
                    sender={sender}
                    orgName={orgName}
                    projectName={projectName}
                    teamName={teamName}
                    onSubmit={onSubmit}
                    isPending={isPending}
                />
            </DialogContent>
        </Dialog>
    );
}

function InviteForm({
    sender,
    orgName,
    projectName,
    teamName,
    onSubmit,
    isPending,
}: Omit<InviteToTeamDialogProps, "open" | "onOpenChange"> & { isPending: boolean }) {
    const [emails, setEmails] = React.useState<string[]>([]);
    const [draft, setDraft] = React.useState("");
    const [message, setMessage] = React.useState("");
    const [role, setRole] = React.useState<ProjectRole>(ProjectRole.Write);
    const [roleOpen, setRoleOpen] = React.useState(false);

    const debouncedDraft = useDebouncedValue(draft, 300);
    const draftLooksInvalid = debouncedDraft.trim().length > 0 && !isValidEmail(debouncedDraft);
    const atLimit = emails.length >= MAX_EMAILS;

    const addEmails = React.useCallback((raw: string) => {
        const candidates = raw
            .split(/[\s,;]+/)
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean);

        setEmails((prev) => {
            const seen = new Set(prev);
            const next = [...prev];
            for (const email of candidates) {
                if (next.length >= MAX_EMAILS) break;
                if (isValidEmail(email) && !seen.has(email)) {
                    seen.add(email);
                    next.push(email);
                }
            }
            return next;
        });
    }, []);

    const commitDraft = React.useCallback(() => {
        if (!draft.trim()) return;
        if (isValidEmail(draft)) {
            addEmails(draft);
            setDraft("");
        }
    }, [draft, addEmails]);

    const removeEmail = React.useCallback((email: string) => {
        setEmails((prev) => prev.filter((e) => e !== email));
    }, []);

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" || e.key === "," || e.key === ";" || e.key === "Tab") {
            if (draft.trim()) {
                e.preventDefault();
                commitDraft();
            }
        } else if (e.key === "Backspace" && !draft && emails.length > 0) {
            removeEmail(emails[emails.length - 1]);
        }
    }

    function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
        const text = e.clipboardData.getData("text");
        if (/[\s,;]/.test(text)) {
            e.preventDefault();
            addEmails(text);
            setDraft("");
        }
    }

    function handleSubmit() {
        // Fold a still-typed valid email into the batch before sending.
        const pending = isValidEmail(draft) ? [draft.trim().toLowerCase()] : [];
        const finalEmails = [...new Set([...emails, ...pending])];
        if (finalEmails.length === 0) return;
        onSubmit({ emails: finalEmails, role, message: message.trim() || undefined });
    }

    const canSubmit = !isPending && (emails.length > 0 || isValidEmail(draft));
    const senderLetter = (sender.name || sender.email || "?").trim().charAt(0).toUpperCase();

    return (
        <main className="flex min-h-0 min-w-0 flex-1 flex-col justify-between *:px-6">
            <section className="flex flex-col items-start gap-y-3 pt-4 pb-2">
                <div className="flex w-full items-center justify-between gap-x-4">
                    <div className="flex items-center justify-start gap-x-1 text-snow text-xs">
                        <PlaygroundAvatar
                            letter={orgName.slice(0, 2)}
                            tone="emerald"
                            className="uppercase"
                        />
                        <span>
                            <MdOutlineKeyboardArrowRight />
                        </span>
                        <span className="text-sm">Invite Members</span>
                    </div>
                    <div className="flex min-w-0 items-center gap-x-2">
                        <PlaygroundAvatar
                            letter={senderLetter}
                            tone="indigo"
                            src={sender.image ?? undefined}
                        />
                        <span className="min-w-0 truncate text-[12px] text-white/45">
                            {sender.email}
                        </span>
                    </div>
                </div>
                <p className="min-h-3.5 text-[11px]">
                    {atLimit ? (
                        <span className="text-amber-400">
                            Maximum of {MAX_EMAILS} emails reached.
                        </span>
                    ) : draftLooksInvalid ? (
                        <span className="text-rose-400">
                            That doesn&apos;t look like a valid email.
                        </span>
                    ) : (
                        <span className="text-neutral-500">
                            Press Enter or comma to add multiple.
                        </span>
                    )}
                </p>
                <div className="flex w-full flex-wrap items-center gap-1.5">
                    {emails.map((email) => (
                        <span
                            key={email}
                            className="flex items-center gap-1 rounded-full bg-white/5 py-1 pr-1 pl-2.5 text-[12px] text-neutral-200 ring ring-white/10"
                        >
                            {email}
                            <Button
                                variant="unstyled"
                                type="button"
                                onClick={() => removeEmail(email)}
                                aria-label={`Remove ${email}`}
                                className="flex size-4 cursor-pointer items-center justify-center rounded-full text-neutral-400 hover:bg-white/10 hover:text-neutral-100"
                            >
                                <MdClose className="size-3" />
                            </Button>
                        </span>
                    ))}
                    <input
                        type="email"
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        onBlur={commitDraft}
                        disabled={atLimit}
                        placeholder={emails.length === 0 ? "name@company.com" : ""}
                        className={cn(
                            GHOST_FIELD,
                            "h-8 min-w-48 flex-1 text-xl font-medium text-neutral-100 placeholder:text-neutral-600 disabled:cursor-not-allowed",
                        )}
                    />
                </div>
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
                    className={cn(GHOST_FIELD, "w-full text-[13px] leading-6 text-neutral-300")}
                />
            </section>

            <section className="flex flex-col gap-y-4 pb-4">
                <div className="flex flex-wrap items-center gap-2.5">
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
                                        <span className="text-[13px] text-neutral-200">
                                            {option}
                                        </span>
                                        <span className="text-[11px] text-neutral-500">
                                            {ROLE_HINTS[option]}
                                        </span>
                                    </Button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>

                    <CapsuleTrigger disabled>{orgName}</CapsuleTrigger>
                    <CapsuleTrigger disabled>{projectName}</CapsuleTrigger>
                    <CapsuleTrigger disabled>{teamName}</CapsuleTrigger>
                </div>

                <div className="flex h-fit items-center justify-end gap-x-2">
                    <Button
                        type="button"
                        variant="tertiary"
                        size="xs"
                        className="text-ink!"
                        onClick={handleSubmit}
                        loading={isPending}
                        disabled={!canSubmit}
                    >
                        Send invites
                    </Button>
                </div>
            </section>
        </main>
    );
}
