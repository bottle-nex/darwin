"use client";

import { useState } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { MdCheck, MdChevronLeft, MdDescription } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCreateTemplate } from "@/hooks/templates/useCreateTemplate";
import { useUpdateTemplate } from "@/hooks/templates/useUpdateTemplate";
import { promptsFromBraces } from "@/lib/templates/promptHtml";
import IssueDescriptionEditor from "@/components/playground/Home/KanbanDisplay/Issue/editor/IssueDescriptionEditor";
import type { ApiResponse } from "@/types/api";
import type { IssueTemplate } from "@/types/issueTemplate";
import IconPicker, { IconPickGlyph, type IconPick } from "@/components/ui/IconPicker";

const GHOST = "w-full bg-transparent outline-none placeholder:text-white/25";

const HINTS = [
    { keys: "/", does: "Headings, lists, code" },
    { keys: "{{}}", does: "Fill-in field" },
    { keys: "Esc", does: "Finish the field" },
];

interface CreateTemplateDisplayProps {
    projectId: string;
    template?: IssueTemplate;
    onDone: () => void;
}

export default function CreateTemplateDisplay({
    projectId,
    template,
    onDone,
}: CreateTemplateDisplayProps) {
    const isEdit = Boolean(template);

    const [name, setName] = useState(template?.name ?? "");
    const [summary, setSummary] = useState(template?.summary ?? "");
    const [isDefault, setIsDefault] = useState(template?.isDefault ?? false);
    const [description, setDescription] = useState(template?.description ?? "");
    const [descriptionEmpty, setDescriptionEmpty] = useState(!template?.description);
    const [icon, setIcon] = useState<IconPick | undefined>(template?.icon);
    const [iconOpen, setIconOpen] = useState(false);

    const createTemplate = useCreateTemplate();
    const updateTemplate = useUpdateTemplate();
    const pending = createTemplate.isPending || updateTemplate.isPending;

    const canSave = name.trim().length > 0 && !descriptionEmpty && !pending;

    function handleError(err: unknown) {
        const code =
            err instanceof AxiosError
                ? (err.response?.data as ApiResponse<unknown> | undefined)?.error?.code
                : undefined;
        if (code === "TEMPLATE_EXISTS") {
            toast.error("A template with this name already exists.");
        } else {
            toast.error("Couldn't save the template.");
        }
    }

    function handleSave() {
        if (!canSave) return;

        const payload = {
            projectId,
            name: name.trim(),
            summary: summary.trim() || undefined,
            description: promptsFromBraces(description),
            icon,
            isDefault,
        };

        const done = {
            onSuccess: () => {
                toast.success(isEdit ? "Template updated." : "Template created.");
                onDone();
            },
            onError: handleError,
        };

        if (template) {
            updateTemplate.mutate({ ...payload, templateId: template.id }, done);
        } else {
            createTemplate.mutate(payload, done);
        }
    }

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                handleSave();
            }}
            className="flex flex-col gap-6 h-full"
        >
            <nav>
                <button
                    type="button"
                    onClick={onDone}
                    className="flex w-fit cursor-pointer items-center gap-0.5 text-[12px] text-neutral-500 hover:text-neutral-300"
                >
                    <MdChevronLeft className="size-4" aria-hidden />
                    Issue templates
                </button>
            </nav>

            <header className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <IconPicker
                        open={iconOpen}
                        onOpenChange={setIconOpen}
                        onSelect={setIcon}
                        align="start"
                    >
                        <button
                            type="button"
                            aria-label="Pick a template icon"
                            className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/8 hover:bg-white/10"
                        >
                            {icon ? (
                                <IconPickGlyph pick={icon} className="size-5 text-lg" />
                            ) : (
                                <MdDescription className="size-5 text-white/40" aria-hidden />
                            )}
                        </button>
                    </IconPicker>
                    <input
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Template name"
                        aria-label="Template name"
                        maxLength={60}
                        className={cn(GHOST, "text-3xl font-semibold text-neutral-100")}
                    />
                </div>
                <input
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Add an optional description…"
                    aria-label="Template description"
                    maxLength={200}
                    className={cn(GHOST, "text-[13px] text-neutral-400")}
                />
            </header>

            <section className="flex flex-col gap-3">
                <ul className="flex list-none flex-wrap items-center gap-x-5 gap-y-2 border-b border-white/6 pb-3 text-[11px] text-neutral-500">
                    {HINTS.map((hint) => (
                        <li key={hint.keys} className="flex items-center gap-1.5">
                            <kbd className="rounded-[5px] bg-white/6 px-1.5 py-0.5 font-mono text-[10px] text-neutral-300 ring-1 ring-white/10">
                                {hint.keys}
                            </kbd>
                            {hint.does}
                        </li>
                    ))}
                </ul>
                <article data-lenis-prevent className="relative min-h-96">
                    <aside
                        data-slot="slash-command-portal"
                        className="pointer-events-none absolute inset-0 z-50"
                    />
                    <IssueDescriptionEditor
                        authoring
                        initialContent={
                            template ? promptsFromBraces(template.description) : undefined
                        }
                        placeholder="Write the issue… press '/' for commands"
                        onChange={(state) => {
                            setDescription(state.html);
                            setDescriptionEmpty(state.isEmpty);
                        }}
                    />
                </article>
            </section>

            <footer className="mt-auto flex items-center justify-between gap-4 border-t border-white/6 pt-4 pb-2">
                <label className="flex cursor-pointer items-center gap-2">
                    <input
                        type="checkbox"
                        checked={isDefault}
                        onChange={(e) => setIsDefault(e.target.checked)}
                        className="sr-only"
                    />
                    <span
                        className={cn(
                            "flex size-4 items-center justify-center rounded-[5px] ring-1 transition-colors",
                            isDefault
                                ? "bg-[#9bc24f] ring-[#9bc24f]"
                                : "bg-white/5 ring-white/15 hover:ring-white/35",
                        )}
                    >
                        {isDefault && <MdCheck className="size-3 text-[#14150c]" aria-hidden />}
                    </span>
                    <span className="text-[12px] text-neutral-400">
                        Load this into every new issue
                    </span>
                </label>

                <menu className="flex items-center gap-2">
                    <Button type="button" variant="tertiary" onClick={onDone} disabled={pending}>
                        Cancel
                    </Button>
                    <Button type="submit" loading={pending} disabled={!canSave}>
                        {isEdit ? "Save" : "Create"}
                    </Button>
                </menu>
            </footer>
        </form>
    );
}
