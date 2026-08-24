"use client";

import { useState } from "react";
import { MdAdd, MdDelete, MdDescription, MdEdit, MdStar, MdStarOutline } from "react-icons/md";

import { Button } from "@/components/ui/button";
import { IconPickGlyph } from "@/components/ui/IconPicker";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import ConfirmDialog from "@/components/utility/ConfirmDialog";
import { useDeleteTemplate } from "@/hooks/templates/useDeleteTemplate";
import { useListTemplates } from "@/hooks/templates/useListTemplates";
import { useUpdateTemplate } from "@/hooks/templates/useUpdateTemplate";
import { toast } from "@/lib/toast";
import type { IssueTemplate } from "@/types/issueTemplate";

import SettingsUtilityCard from "../SettingsUtilityCard";
import CreateTemplateDisplay from "./CreateTemplateDisplay";

type View = { kind: "list" } | { kind: "edit"; template?: IssueTemplate };

export default function IssueTemplatesDisplay({ projectId }: { projectId: string | undefined }) {
    const templates = useListTemplates(projectId);
    const updateTemplate = useUpdateTemplate();
    const deleteTemplate = useDeleteTemplate();

    const [view, setView] = useState<View>({ kind: "list" });
    const [confirmDelete, setConfirmDelete] = useState<IssueTemplate | null>(null);

    if (view.kind === "edit" && projectId) {
        return (
            <CreateTemplateDisplay
                key={view.template?.id ?? "new"}
                projectId={projectId}
                template={view.template}
                onDone={() => setView({ kind: "list" })}
            />
        );
    }

    function makeDefault(template: IssueTemplate) {
        if (!projectId) return;
        updateTemplate.mutate(
            { projectId, templateId: template.id, isDefault: true },
            {
                onSuccess: () => toast.success(`"${template.name}" is now the default.`),
                onError: () => toast.error("Couldn't set the default."),
            },
        );
    }

    function removeTemplate(template: IssueTemplate) {
        if (!projectId) return;
        deleteTemplate.mutate(
            { projectId, templateId: template.id },
            {
                onSuccess: () => {
                    toast.success("Template deleted.");
                    setConfirmDelete(null);
                },
                onError: () => toast.error("Couldn't delete the template."),
            },
        );
    }

    const list = templates.data ?? [];

    return (
        <SettingsUtilityCard
            title="Issue templates"
            description="A pre-written issue body. Write it the way you'd want issues filed, mark one as the default, and everyone starts from it. Every project also has built-in starters, which show up in the picker on their own."
            headerAction={
                <Button
                    type="button"
                    size="sm"
                    variant="tertiary"
                    disabled={!projectId}
                    onClick={() => setView({ kind: "edit" })}
                >
                    <MdAdd className="size-3" aria-hidden />
                    New template
                </Button>
            }
        >
            <section>
                <h3 className="mb-2 text-[11px] font-medium tracking-wide text-neutral-500 uppercase">
                    {list.length} template{list.length === 1 ? "" : "s"}
                </h3>
                {templates.isLoading ? (
                    <p className="px-1 py-3 text-[13px] text-neutral-500">Loading…</p>
                ) : list.length === 0 ? (
                    <p className="rounded-lg bg-white/5 px-3 py-6 text-center text-[13px] text-neutral-500 shadow-[inset_0_1px_0_0_var(--color-edge)]">
                        No issue templates yet.
                    </p>
                ) : (
                    <ul className="flex list-none flex-col gap-2">
                        {list.map((template) => {
                            const deleting =
                                deleteTemplate.isPending &&
                                deleteTemplate.variables?.templateId === template.id;
                            const defaulting =
                                updateTemplate.isPending &&
                                updateTemplate.variables?.templateId === template.id;
                            return (
                                <li
                                    key={template.id}
                                    className="group flex flex-col gap-1 rounded-lg bg-white/5 px-3 py-2.5 shadow-[inset_0_1px_0_0_var(--color-edge)]"
                                >
                                    <article className="flex items-center justify-between gap-3">
                                        <hgroup className="flex min-w-0 items-center gap-2">
                                            {template.icon ? (
                                                <IconPickGlyph
                                                    pick={template.icon}
                                                    className="size-3.5 shrink-0 text-sm"
                                                />
                                            ) : (
                                                <MdDescription
                                                    className="size-3.5 shrink-0 text-white/35"
                                                    aria-hidden
                                                />
                                            )}
                                            <h4 className="truncate text-[13px] font-normal text-neutral-200">
                                                {template.name}
                                            </h4>
                                            {template.isDefault && (
                                                <span className="flex shrink-0 items-center gap-1 rounded-full bg-matcha/10 px-2 py-0.5 text-[10px] text-matcha">
                                                    <MdStar className="size-2.5" aria-hidden />
                                                    Default
                                                </span>
                                            )}
                                        </hgroup>
                                        <menu className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                                            {!template.isDefault && (
                                                <TooltipComponent content="Make default">
                                                    <Button
                                                        variant="unstyled"
                                                        type="button"
                                                        aria-label={`Make ${template.name} the default`}
                                                        loading={defaulting}
                                                        iconOnly
                                                        onClick={() => makeDefault(template)}
                                                        className="flex size-6 cursor-pointer items-center justify-center rounded text-neutral-400 hover:bg-neutral-700/50 hover:text-matcha disabled:opacity-40 [&_svg]:size-3"
                                                    >
                                                        <MdStarOutline
                                                            className="size-3"
                                                            aria-hidden
                                                        />
                                                    </Button>
                                                </TooltipComponent>
                                            )}
                                            <Button
                                                variant="unstyled"
                                                type="button"
                                                aria-label={`Edit ${template.name}`}
                                                onClick={() => setView({ kind: "edit", template })}
                                                className="flex size-6 cursor-pointer items-center justify-center rounded text-neutral-400 hover:bg-neutral-700/50 hover:text-neutral-200"
                                            >
                                                <MdEdit className="size-3" aria-hidden />
                                            </Button>
                                            <Button
                                                variant="unstyled"
                                                type="button"
                                                aria-label={`Delete ${template.name}`}
                                                loading={deleting}
                                                iconOnly
                                                onClick={() => setConfirmDelete(template)}
                                                className="flex size-6 cursor-pointer items-center justify-center rounded text-neutral-400 hover:bg-neutral-700/50 hover:text-red-500 disabled:opacity-40 [&_svg]:size-3"
                                            >
                                                <MdDelete className="size-3" aria-hidden />
                                            </Button>
                                        </menu>
                                    </article>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            <ConfirmDialog
                open={Boolean(confirmDelete)}
                onOpenChange={(next) => !next && setConfirmDelete(null)}
                title="Delete template?"
                description={`"${confirmDelete?.name}" will no longer be offered when someone files an issue. Issues already filed with it keep their description.`}
                cancel={{
                    label: "Cancel",
                    variant: "outline",
                    onClick: () => setConfirmDelete(null),
                }}
                confirm={{
                    label: "Delete",
                    variant: "destructive",
                    onClick: () => confirmDelete && removeTemplate(confirmDelete),
                }}
                pending={deleteTemplate.isPending}
            />
        </SettingsUtilityCard>
    );
}
