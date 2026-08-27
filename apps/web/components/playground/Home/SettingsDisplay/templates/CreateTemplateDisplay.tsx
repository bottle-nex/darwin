"use client";

import type { Editor } from "@tiptap/react";
import { BackChevronIcon, CheckIcon, TemplateDocumentIcon } from "@trymatcha/ui/icons";
import { AxiosError } from "axios";
import { useState } from "react";

import IssueDescriptionEditor from "@/components/playground/Issue/editor/IssueDescriptionEditor";
import { Button } from "@/components/ui/button";
import IconPicker, { type IconPick, IconPickGlyph } from "@/components/ui/IconPicker";
import ConfirmDialog from "@/components/utility/ConfirmDialog";
import { useEscapeExit } from "@/hooks/shortcuts/useEscapeExit";
import { useCreateTemplate } from "@/hooks/templates/useCreateTemplate";
import { useUpdateTemplate } from "@/hooks/templates/useUpdateTemplate";
import { promptsFromBraces } from "@/lib/templates/promptHtml";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";
import type { IssueTemplate } from "@/types/issueTemplate";

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
    const [isDefault, setIsDefault] = useState(template?.isDefault ?? false);
    const [description, setDescription] = useState(template?.description ?? "");
    const [descriptionEmpty, setDescriptionEmpty] = useState(!template?.description);
    const [icon, setIcon] = useState<IconPick | undefined>(template?.icon);
    const [iconOpen, setIconOpen] = useState(false);
    const [descriptionBaseline, setDescriptionBaseline] = useState<string | null>(null);
    const [confirmingExit, setConfirmingExit] = useState(false);
    const [editor, setEditor] = useState<Editor | null>(null);

    const createTemplate = useCreateTemplate();
    const updateTemplate = useUpdateTemplate();
    const pending = createTemplate.isPending || updateTemplate.isPending;

    const canSave = name.trim().length > 0 && !descriptionEmpty && !pending;

    const isDirty =
        name !== (template?.name ?? "") ||
        isDefault !== (template?.isDefault ?? false) ||
        JSON.stringify(icon ?? null) !== JSON.stringify(template?.icon ?? null) ||
        (descriptionBaseline !== null && description !== descriptionBaseline);

    useEscapeExit({
        enabled: !confirmingExit && !iconOpen,
        isDirty,
        editor,
        onExit: onDone,
        onDirtyExit: () => setConfirmingExit(true),
    });

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
                <Button
                    variant="unstyled"
                    type="button"
                    onClick={onDone}
                    className="flex w-fit cursor-pointer items-center gap-0.5 text-[12px] text-neutral-500 hover:text-neutral-300"
                >
                    <BackChevronIcon className="size-4" aria-hidden />
                    Issue templates
                </Button>
            </nav>

            <header className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <IconPicker
                        open={iconOpen}
                        onOpenChange={setIconOpen}
                        onSelect={setIcon}
                        align="start"
                    >
                        <Button
                            variant="unstyled"
                            type="button"
                            aria-label="Pick a template icon"
                            className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/8 hover:bg-white/10"
                        >
                            {icon ? (
                                <IconPickGlyph pick={icon} className="size-5 text-lg" />
                            ) : (
                                <TemplateDocumentIcon
                                    className="size-5 text-white/40"
                                    aria-hidden
                                />
                            )}
                        </Button>
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
                    <IssueDescriptionEditor
                        authoring
                        initialContent={
                            template ? promptsFromBraces(template.description) : undefined
                        }
                        placeholder="Write the issue… press '/' for commands"
                        onReady={setEditor}
                        onChange={(state) => {
                            if (descriptionBaseline === null) setDescriptionBaseline(state.html);
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
                                ? "bg-matcha ring-matcha"
                                : "bg-white/5 ring-white/15 hover:ring-white/35",
                        )}
                    >
                        {isDefault && (
                            <CheckIcon className="size-3 text-matcha-foreground" aria-hidden />
                        )}
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

            <ConfirmDialog
                open={confirmingExit}
                onOpenChange={setConfirmingExit}
                title="Save your changes?"
                description="This template has unsaved edits. Leaving now will lose them."
                cancel={{ label: "Discard", variant: "destructive", onClick: onDone }}
                confirm={{ label: "Save", variant: "tertiary", onClick: handleSave }}
                pending={pending}
            />
        </form>
    );
}
