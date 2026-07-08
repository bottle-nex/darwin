"use client";

import * as React from "react";
import { MdClose } from "react-icons/md";
import { IoPersonAddOutline } from "react-icons/io5";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    const [emails, setEmails] = React.useState<string[]>([]);
    const [draft, setDraft] = React.useState("");
    const [message, setMessage] = React.useState("");
    const [role, setRole] = React.useState<ProjectRole>(ProjectRole.Write);

    const debouncedDraft = useDebouncedValue(draft, 300);
    const draftLooksInvalid = debouncedDraft.trim().length > 0 && !isValidEmail(debouncedDraft);
    const atLimit = emails.length >= MAX_EMAILS;

    // Reset everything whenever the dialog is closed.
    function handleOpenChange(next: boolean) {
        if (!next) {
            setEmails([]);
            setDraft("");
            setMessage("");
            setRole(ProjectRole.Write);
        }
        onOpenChange(next);
    }

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
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className="gap-0 border-white/5 bg-charcoal p-0 sm:max-w-md"
                showCloseButton={false}
            >
                <DialogHeader className="border-b border-white/5 px-5 py-4">
                    <DialogTitle className="flex items-center gap-2 text-[15px] font-semibold text-neutral-100">
                        <IoPersonAddOutline className="size-4 text-neutral-400" />
                        Invite members
                    </DialogTitle>
                    <DialogDescription className="text-[12px] text-neutral-500">
                        Send an email invite to join this team.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 px-5 py-4">
                    {/* From */}
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                            From
                        </span>
                        <div className="flex items-center gap-2.5">
                            {sender.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={sender.image}
                                    alt={sender.name ?? sender.email ?? "Sender"}
                                    className="size-8 shrink-0 rounded-[5px] object-cover"
                                />
                            ) : (
                                <PlaygroundAvatar size="xl" letter={senderLetter} tone="indigo" />
                            )}
                            <div className="min-w-0">
                                <p className="truncate text-[13px] font-medium text-neutral-100">
                                    {sender.name ?? "You"}
                                </p>
                                <p className="truncate text-[11px] text-neutral-500">
                                    {sender.email}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* To */}
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                            To
                        </span>
                        <div
                            className={cn(
                                "flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg bg-[#1a1a1a] px-2 py-1.5 shadow-[inset_0_1px_0_0_#262626]",
                                draftLooksInvalid &&
                                    "shadow-[inset_0_1px_0_0_#262626,inset_0_0_0_1px_rgb(244_63_94/0.4)]",
                            )}
                        >
                            {emails.map((email) => (
                                <span
                                    key={email}
                                    className="flex items-center gap-1 rounded-md bg-white/5 py-1 pl-2 pr-1 text-[12px] text-neutral-200"
                                >
                                    {email}
                                    <button
                                        type="button"
                                        onClick={() => removeEmail(email)}
                                        aria-label={`Remove ${email}`}
                                        className="flex size-4 cursor-pointer items-center justify-center rounded text-neutral-400 hover:bg-white/10 hover:text-neutral-100"
                                    >
                                        <MdClose className="size-3" />
                                    </button>
                                </span>
                            ))}
                            <input
                                type="email"
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onPaste={handlePaste}
                                onBlur={commitDraft}
                                disabled={atLimit}
                                placeholder={emails.length === 0 ? "name@company.com" : ""}
                                className="h-7 min-w-32 flex-1 bg-transparent px-1 text-[13px] text-[#e5e5e5] outline-none placeholder:text-[#737373] disabled:cursor-not-allowed"
                            />
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
                    </div>

                    {/* Role */}
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                            Project role
                        </span>
                        <Select value={role} onValueChange={(v) => setRole(v as ProjectRole)}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PROJECT_ROLES.map((r) => (
                                    <SelectItem key={r} value={r}>
                                        {r}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="min-h-3.5 text-[11px] text-neutral-500">{ROLE_HINTS[role]}</p>
                    </div>

                    {/* Context */}
                    <div className="flex flex-col gap-1.5 rounded-lg bg-white/2 p-3 ring-1 ring-white/5">
                        <Detail label="Organization" value={orgName} />
                        <Detail label="Project" value={projectName} />
                        <Detail label="Team" value={teamName} />
                    </div>

                    {/* Message */}
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                            Message{" "}
                            <span className="font-normal lowercase text-neutral-600">
                                (optional)
                            </span>
                        </span>
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            maxLength={500}
                            placeholder="Add a short note to the invite…"
                            className="h-24 resize-none rounded-lg border-0 bg-[#1a1a1a] text-[13px] text-[#e5e5e5] shadow-[inset_0_1px_0_0_#262626] placeholder:text-[#737373] focus-visible:ring-0"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-white/5 px-5 py-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenChange(false)}
                        className="h-8 cursor-pointer text-[12px] text-neutral-400 hover:bg-white/5 hover:text-neutral-100"
                    >
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="h-8 cursor-pointer rounded-md bg-neutral-100 px-3 text-[12px] font-medium text-neutral-900 hover:bg-white disabled:opacity-50"
                    >
                        {isPending ? "Sending…" : "Send invites"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] text-neutral-500">{label}</span>
            <span className="truncate text-[12px] font-medium text-neutral-200">{value}</span>
        </div>
    );
}
